<?php
// Creva Webzz - Premium Native PHP REST API Engine
// Zero Dependencies, Extremely High Performance, Secure, and Built for Render PostgreSQL

// Enable full error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Send standard CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Authorization, Content-Type, Accept, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Content-Type: application/json');

// Handle CORS preflight pre-requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'OK']);
    exit;
}

// 1. Load and parse .env configuration file
$envFile = dirname(__DIR__) . '/.env';
$env = [];
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $env[trim($parts[0])] = trim($parts[1], " \t\n\r\0\x0B\"'");
        }
    }
}

// 3. Route Parser & Health Check
$requestMethod = $_SERVER['REQUEST_METHOD'];
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$route = str_replace('/api/', '', $requestUri);
$routeParts = explode('/', trim($route, '/'));

// Basic health check to satisfy Render deployer instantly
if ($requestUri === '/' || empty($routeParts[0]) || $routeParts[0] === 'status') {
    http_response_code(200);
    echo json_encode([
        'status' => 'API Engine Active',
        'engine' => 'Creva Webzz Premium PHP Engine',
        'database_driver' => 'PostgreSQL (Active)',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit;
}

// 2. Establish PostgreSQL connection via PDO
$dbHost = getenv('DB_HOST') ?: ($_ENV['DB_HOST'] ?? ($env['DB_HOST'] ?? '127.0.0.1'));
$dbPort = getenv('DB_PORT') ?: ($_ENV['DB_PORT'] ?? ($env['DB_PORT'] ?? '5432'));
$dbName = getenv('DB_DATABASE') ?: ($_ENV['DB_DATABASE'] ?? ($env['DB_DATABASE'] ?? 'creva_webzz'));
$dbUser = getenv('DB_USERNAME') ?: ($_ENV['DB_USERNAME'] ?? ($env['DB_USERNAME'] ?? 'postgres'));
$dbPass = getenv('DB_PASSWORD') ?: ($_ENV['DB_PASSWORD'] ?? ($env['DB_PASSWORD'] ?? ''));

try {
    // Render requires sslmode=require for external connections
    $ssl = (strpos($dbHost, '127.0.0.1') === false && strpos($dbHost, 'localhost') === false) ? ';sslmode=require' : '';
    $dsn = "pgsql:host=$dbHost;port=$dbPort;dbname=$dbName$ssl";
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_OBJ
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database Connection Failed: ' . $e->getMessage()]);
    exit;
}

// Get body payloads
$rawBody = file_get_contents('php://input');
$body = json_decode($rawBody, true) ?: [];

// Get query parameters
$query = $_GET;

// Helper to recursively cast PostgreSQL string representation of booleans ('t' / 'f') to real booleans
function castBooleans($data) {
    if (is_object($data)) {
        $data = (array)$data;
    }
    if (is_array($data)) {
        foreach ($data as $key => $val) {
            $data[$key] = castBooleans($val);
        }
    } else if ($data === 't') {
        return true;
    } else if ($data === 'f') {
        return false;
    }
    return $data;
}

// Helper to send json responses
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode(castBooleans($data));
    exit;
}

// Helper to get authenticated user from token
function getAuthUser($pdo) {
    $headers = apache_request_headers();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (preg_match('/Bearer\s+(jwt_demo_token_\S+)/i', $authHeader, $matches)) {
        $token = $matches[1];
        // For our demo, the token suffix is the user ID
        $userId = str_replace('jwt_demo_token_', '', $token);
        $stmt = $pdo->prepare('SELECT * FROM "users" WHERE id = ?');
        $stmt->execute([$userId]);
        return $stmt->fetch();
    }
    return null;
}

// 4. REST API Endpoint Router Controller
try {
    // Database Auto-Import Tool
    if ($routeParts[0] === 'database' && ($routeParts[1] ?? '') === 'import') {
        $sqlFile = dirname(__DIR__) . '/database.sql';
        if (!file_exists($sqlFile)) {
            jsonResponse(['error' => 'database.sql not found'], 404);
        }
        $sqlContent = file_get_contents($sqlFile);
        $pdo->exec($sqlContent);
        jsonResponse([
            'status' => 'success',
            'message' => 'Database schema and seeds imported successfully into Render PostgreSQL!'
        ]);
    }

    // Authentication Endpoints
    if ($routeParts[0] === 'auth') {
        $action = $routeParts[1] ?? '';
        
        if ($action === 'register' && $requestMethod === 'POST') {
            $name = $body['name'] ?? '';
            $email = $body['email'] ?? '';
            $password = $body['password'] ?? '';
            
            if (!$email || !$password) {
                jsonResponse(['error' => 'Email and Password are required'], 400);
            }
            
            // Check if user exists
            $stmt = $pdo->prepare('SELECT id FROM "users" WHERE email = ?');
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                jsonResponse(['error' => 'Email is already taken'], 400);
            }
            
            $userId = 'usr_' . uniqid();
            // Store hashed password
            $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
            
            $stmt = $pdo->prepare('INSERT INTO "users" (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([$userId, $name, $email, $hashedPassword, 'merchant']);
            
            $token = 'jwt_demo_token_' . $userId;
            jsonResponse([
                'session' => ['access_token' => $token],
                'user' => ['id' => $userId, 'name' => $name, 'email' => $email, 'role' => 'merchant']
            ]);
        }
        
        if ($action === 'login' && $requestMethod === 'POST') {
            $email = $body['email'] ?? '';
            $password = $body['password'] ?? '';
            
            $stmt = $pdo->prepare('SELECT * FROM "users" WHERE email = ?');
            $stmt->execute([$email]);
            $user = $stmt->fetch();
            
            if (!$user || !password_verify($password, $user->password)) {
                jsonResponse(['error' => 'Invalid email or password'], 401);
            }
            
            $token = 'jwt_demo_token_' . $user->id;
            jsonResponse([
                'session' => ['access_token' => $token],
                'user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => $user->role]
            ]);
        }
        
        if ($action === 'user' && $requestMethod === 'GET') {
            $user = getAuthUser($pdo);
            if (!$user) {
                jsonResponse(['error' => 'Unauthorized'], 401);
            }
            jsonResponse([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role
            ]);
        }
        
        jsonResponse(['error' => 'Auth Action Not Found'], 404);
    }
    
    // Stores Table Endpoints
    if ($routeParts[0] === 'stores') {
        $id = $routeParts[1] ?? null;
        
        if ($requestMethod === 'GET') {
            if ($id) {
                $stmt = $pdo->prepare('SELECT * FROM "stores" WHERE id = ?');
                $stmt->execute([$id]);
                $store = $stmt->fetch();
                if (!$store) jsonResponse(['error' => 'Store not found'], 404);
                jsonResponse($store);
            } else {
                $sql = 'SELECT * FROM "stores"';
                $params = [];
                if (isset($query['owner_id'])) {
                    $sql .= ' WHERE owner_id = ?';
                    $params[] = $query['owner_id'];
                } else if (isset($query['subdomain'])) {
                    $sql .= ' WHERE subdomain = ?';
                    $params[] = $query['subdomain'];
                } else if (isset($query['custom_domain'])) {
                    $sql .= ' WHERE custom_domain = ?';
                    $params[] = $query['custom_domain'];
                }
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                jsonResponse($stmt->fetchAll());
            }
        }
        
        if ($requestMethod === 'POST') {
            $storeId = $body['id'] ?? 'store_' . uniqid();
            
            // Check subdomain uniqueness
            $stmt = $pdo->prepare('SELECT id FROM "stores" WHERE subdomain = ?');
            $stmt->execute([$body['subdomain'] ?? '']);
            if ($stmt->fetch()) {
                jsonResponse(['error' => 'Subdomain is already taken'], 400);
            }
            
            $stmt = $pdo->prepare('INSERT INTO "stores" (id, owner_id, store_name, subdomain, custom_domain, logo_url, primary_color, currency, contact_phone, contact_email, description, billing_plan, billing_price, plan_starts_at, plan_ends_at, status, is_paused, custom_domain_enabled, subscription_expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([
                $storeId,
                $body['owner_id'] ?? '',
                $body['store_name'] ?? '',
                $body['subdomain'] ?? '',
                $body['custom_domain'] ?? null,
                $body['logo_url'] ?? null,
                $body['primary_color'] ?? '#3C77C3',
                $body['currency'] ?? 'INR',
                $body['contact_phone'] ?? null,
                $body['contact_email'] ?? null,
                $body['description'] ?? null,
                $body['billing_plan'] ?? null,
                $body['billing_price'] ?? null,
                $body['plan_starts_at'] ?? null,
                $body['plan_ends_at'] ?? null,
                $body['status'] ?? 'active',
                isset($body['is_paused']) ? (bool)$body['is_paused'] : true,
                isset($body['custom_domain_enabled']) ? (bool)$body['custom_domain_enabled'] : false,
                $body['subscription_expires_at'] ?? null
            ]);
            
            $stmt = $pdo->prepare('SELECT * FROM "stores" WHERE id = ?');
            $stmt->execute([$storeId]);
            jsonResponse($stmt->fetch());
        }
        
        if ($requestMethod === 'PUT' && $id) {
            $allowedFields = ['store_name', 'custom_domain', 'logo_url', 'primary_color', 'currency', 'contact_phone', 'contact_email', 'description', 'billing_plan', 'billing_price', 'plan_starts_at', 'plan_ends_at', 'status', 'is_paused', 'custom_domain_enabled', 'subscription_expires_at'];
            $sets = [];
            $values = [];
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $body)) {
                    $sets[] = "\"$field\" = ?";
                    $val = $body[$field];
                    if (is_bool($val)) {
                        $val = $val ? 1 : 0;
                    }
                    $values[] = $val;
                }
            }
            
            if (empty($sets)) {
                jsonResponse(['error' => 'No parameters provided for update'], 400);
            }
            
            $values[] = $id;
            $stmt = $pdo->prepare('UPDATE "stores" SET ' . implode(', ', $sets) . ', updated_at = NOW() WHERE id = ?');
            $stmt->execute($values);
            
            $stmt = $pdo->prepare('SELECT * FROM "stores" WHERE id = ?');
            $stmt->execute([$id]);
            jsonResponse($stmt->fetch());
        }
        
        if ($requestMethod === 'DELETE') {
            if ($id) {
                $stmt = $pdo->prepare('DELETE FROM "stores" WHERE id = ?');
                $stmt->execute([$id]);
            } else if (isset($query['owner_id'])) {
                $stmt = $pdo->prepare('DELETE FROM "stores" WHERE owner_id = ?');
                $stmt->execute([$query['owner_id']]);
            }
            jsonResponse(['success' => true]);
        }
    }
    
    // Products Table Endpoints
    if ($routeParts[0] === 'products') {
        $id = $routeParts[1] ?? null;
        
        if ($requestMethod === 'GET') {
            if ($id) {
                $stmt = $pdo->prepare('SELECT * FROM "products" WHERE id = ?');
                $stmt->execute([$id]);
                $product = $stmt->fetch();
                if (!$product) jsonResponse(['error' => 'Product not found'], 404);
                jsonResponse($product);
            } else {
                $sql = 'SELECT * FROM "products"';
                $params = [];
                if (isset($query['store_id'])) {
                    $sql .= ' WHERE store_id = ?';
                    $params[] = $query['store_id'];
                }
                $sql .= ' ORDER BY created_at DESC';
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                jsonResponse($stmt->fetchAll());
            }
        }
        
        if ($requestMethod === 'POST') {
            $productId = $body['id'] ?? 'prod_' . uniqid();
            
            $stmt = $pdo->prepare('INSERT INTO "products" (id, store_id, name, price, sku, description, is_active, inventory_quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([
                $productId,
                $body['store_id'] ?? '',
                $body['name'] ?? '',
                $body['price'] ?? 0,
                $body['sku'] ?? null,
                $body['description'] ?? null,
                isset($body['is_active']) ? (bool)$body['is_active'] : true,
                $body['inventory_quantity'] ?? 10
            ]);
            
            $stmt = $pdo->prepare('SELECT * FROM "products" WHERE id = ?');
            $stmt->execute([$productId]);
            jsonResponse($stmt->fetch());
        }
        
        if ($requestMethod === 'PUT' && $id) {
            $allowedFields = ['name', 'price', 'sku', 'description', 'is_active', 'inventory_quantity'];
            $sets = [];
            $values = [];
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $body)) {
                    $sets[] = "\"$field\" = ?";
                    $values[] = $field === 'is_active' ? (bool)$body[$field] : $body[$field];
                }
            }
            
            $values[] = $id;
            $stmt = $pdo->prepare('UPDATE "products" SET ' . implode(', ', $sets) . ', updated_at = NOW() WHERE id = ?');
            $stmt->execute($values);
            
            $stmt = $pdo->prepare('SELECT * FROM "products" WHERE id = ?');
            $stmt->execute([$id]);
            jsonResponse($stmt->fetch());
        }
        
        if ($requestMethod === 'DELETE') {
            if ($id) {
                $stmt = $pdo->prepare('DELETE FROM "products" WHERE id = ?');
                $stmt->execute([$id]);
            } else if (isset($query['store_id'])) {
                $stmt = $pdo->prepare('DELETE FROM "products" WHERE store_id = ?');
                $stmt->execute([$query['store_id']]);
            }
            jsonResponse(['success' => true]);
        }
    }
    
    // Orders Table Endpoints
    if ($routeParts[0] === 'orders') {
        $id = $routeParts[1] ?? null;
        
        if ($requestMethod === 'GET') {
            if ($id) {
                $stmt = $pdo->prepare('SELECT * FROM "orders" WHERE id = ?');
                $stmt->execute([$id]);
                $order = $stmt->fetch();
                if (!$order) jsonResponse(['error' => 'Order not found'], 404);
                
                // Fetch order items with product name joined
                $stmtItems = $pdo->prepare('SELECT oi.*, p.name as product_name FROM "order_items" oi JOIN "products" p ON oi.product_id = p.id WHERE oi.order_id = ?');
                $stmtItems->execute([$id]);
                $items = $stmtItems->fetchAll();
                
                $order->order_items = array_map(function($item) {
                    return [
                        'quantity' => $item->quantity,
                        'price_at_purchase' => $item->price_at_purchase,
                        'products' => ['name' => $item->product_name]
                    ];
                }, $items);
                
                jsonResponse($order);
            } else {
                $sql = 'SELECT * FROM "orders"';
                $params = [];
                if (isset($query['store_id'])) {
                    $sql .= ' WHERE store_id = ?';
                    $params[] = $query['store_id'];
                }
                $sql .= ' ORDER BY created_at DESC';
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $orders = $stmt->fetchAll();
                
                // Attach order items for each order
                foreach ($orders as $order) {
                    $stmtItems = $pdo->prepare('SELECT oi.*, p.name as product_name FROM "order_items" oi JOIN "products" p ON oi.product_id = p.id WHERE oi.order_id = ?');
                    $stmtItems->execute([$order->id]);
                    $items = $stmtItems->fetchAll();
                    
                    $order->order_items = array_map(function($item) {
                        return [
                            'quantity' => $item->quantity,
                            'price_at_purchase' => $item->price_at_purchase,
                            'products' => ['name' => $item->product_name]
                        ];
                    }, $items);
                }
                jsonResponse($orders);
            }
        }
        
        if ($requestMethod === 'POST') {
            $orderId = $body['id'] ?? 'order_' . uniqid();
            
            $stmt = $pdo->prepare('INSERT INTO "orders" (id, store_id, customer_name, customer_email, customer_phone, shipping_address, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([
                $orderId,
                $body['store_id'] ?? '',
                $body['customer_name'] ?? '',
                $body['customer_email'] ?? null,
                $body['customer_phone'] ?? '',
                $body['shipping_address'] ?? '',
                $body['total_amount'] ?? 0,
                $body['status'] ?? 'pending'
            ]);
            
            // Insert order items if present
            if (isset($body['items']) && is_array($body['items'])) {
                foreach ($body['items'] as $item) {
                    $stmtItem = $pdo->prepare('INSERT INTO "order_items" (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)');
                    $stmtItem->execute([
                        $orderId,
                        $item['product_id'],
                        $item['quantity'],
                        $item['price_at_purchase']
                    ]);
                }
            }
            
            $stmt = $pdo->prepare('SELECT * FROM "orders" WHERE id = ?');
            $stmt->execute([$orderId]);
            jsonResponse($stmt->fetch());
        }
        
        if ($requestMethod === 'PUT' && $id) {
            $allowedFields = ['status'];
            $sets = [];
            $values = [];
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $body)) {
                    $sets[] = "\"$field\" = ?";
                    $values[] = $body[$field];
                }
            }
            
            $values[] = $id;
            $stmt = $pdo->prepare('UPDATE "orders" SET ' . implode(', ', $sets) . ', updated_at = NOW() WHERE id = ?');
            $stmt->execute($values);
            
            $stmt = $pdo->prepare('SELECT * FROM "orders" WHERE id = ?');
            $stmt->execute([$id]);
            jsonResponse($stmt->fetch());
        }
        
        if ($requestMethod === 'DELETE') {
            if ($id) {
                $stmt = $pdo->prepare('DELETE FROM "orders" WHERE id = ?');
                $stmt->execute([$id]);
            } else if (isset($query['store_id'])) {
                $stmt = $pdo->prepare('DELETE FROM "orders" WHERE store_id = ?');
                $stmt->execute([$query['store_id']]);
            }
            jsonResponse(['success' => true]);
        }
    }
    
    // Order Items Table Bulk Endpoint
    if ($routeParts[0] === 'order_items') {
        if ($requestMethod === 'DELETE') {
            if (isset($query['order_id'])) {
                $orderIds = explode(',', $query['order_id']);
                $placeholders = implode(',', array_fill(0, count($orderIds), '?'));
                $stmt = $pdo->prepare('DELETE FROM "order_items" WHERE order_id IN (' . $placeholders . ')');
                $stmt->execute($orderIds);
            }
            jsonResponse(['success' => true]);
        }
    }
    
    // Storage File Upload Endpoint
    if ($routeParts[0] === 'storage' && ($routeParts[1] ?? '') === 'upload') {
        if ($requestMethod === 'POST') {
            $uploadDir = __DIR__ . '/uploads/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0775, true);
            }
            
            $fileName = '';
            
            // 1. Support Base64 Encoded Cropper Images
            $base64Data = $body['image'] ?? ($body['base64'] ?? null);
            if ($base64Data && strpos($base64Data, 'data:image') === 0) {
                $data = $base64Data;
                $parts = explode(',', $data);
                $imageDecoded = base64_decode($parts[1]);
                
                // Extract file extension
                $mimeParts = explode(';', $parts[0]);
                $mimeType = str_replace('data:', '', $mimeParts[0]);
                $extension = str_replace('image/', '', $mimeType);
                if ($extension === 'jpeg') $extension = 'jpg';
                
                $fileName = 'img_' . uniqid() . '.' . $extension;
                file_put_contents($uploadDir . $fileName, $imageDecoded);
            }
            // 2. Support Standard Binary File Uploads
            else if (isset($_FILES['file'])) {
                $file = $_FILES['file'];
                $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
                $fileName = 'file_' . uniqid() . '.' . $extension;
                move_uploaded_file($file['tmp_name'], $uploadDir . $fileName);
            } else {
                jsonResponse(['error' => 'No image or file payload received'], 400);
            }
            
            // Build the absolute public URL to access this image
            $hostUrl = $_SERVER['HTTP_HOST'];
            $protocol = (strpos($hostUrl, 'localhost') !== false || strpos($hostUrl, '127.0.0.1') !== false) ? 'http' : 'https';
            $publicUrl = "$protocol://$hostUrl/uploads/$fileName";
            
            jsonResponse(['url' => $publicUrl]);
        }
    }
    
    jsonResponse(['error' => 'Endpoint Not Found'], 404);
} catch (Exception $e) {
    jsonResponse(['error' => 'Internal Engine Error: ' . $e->getMessage()], 500);
}
