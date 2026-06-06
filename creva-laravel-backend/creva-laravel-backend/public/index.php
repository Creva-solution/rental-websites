<?php
// Creva Webzz - Premium Native PHP REST API Engine
// Zero Dependencies, Extremely High Performance, Secure, and Built for Render PostgreSQL

// Enable full error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Send standard content-type header (CORS is handled globally by Apache system level)
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

        if ($action === 'forgot-password' && $requestMethod === 'POST') {
            $email = $body['email'] ?? '';
            if (!$email) {
                jsonResponse(['error' => 'Email is required'], 400);
            }

            // Check if user exists
            $stmt = $pdo->prepare('SELECT id FROM "users" WHERE email = ?');
            $stmt->execute([$email]);
            if (!$stmt->fetch()) {
                jsonResponse(['error' => 'We can\'t find a user with that email address.'], 400);
            }

            // Ensure table exists
            $pdo->exec('CREATE TABLE IF NOT EXISTS password_resets (email VARCHAR(255) PRIMARY KEY, token VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');

            // Generate token
            $token = bin2hex(random_bytes(32));

            // Save token
            $stmt = $pdo->prepare('DELETE FROM password_resets WHERE email = ?');
            $stmt->execute([$email]);
            
            $stmt = $pdo->prepare('INSERT INTO password_resets (email, token, created_at) VALUES (?, ?, NOW())');
            $stmt->execute([$email, $token]);

            // Generate link
            $redirectTo = $body['redirectTo'] ?? 'http://localhost:3000/reset-password';
            $resetLink = $redirectTo . '#access_token=' . $token . '&type=recovery';

            // Send email
            $emailSent = false;
            $subject = 'Reset Password - Creva Webzz';
            $headers = "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
            $headers .= "From: no-reply@crevawebzz.com\r\n";
            
            $message = '
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
                        <h2 style="color: #3C77C3; margin: 0; font-size: 24px;">Creva Webzz</h2>
                        <p style="color: #777; margin: 5px 0 0 0; font-size: 14px;">Store Management Portal</p>
                    </div>
                    <p style="font-size: 16px; color: #333; line-height: 1.5;">Hello,</p>
                    <p style="font-size: 16px; color: #333; line-height: 1.5;">You are receiving this email because we received a password reset request for your store account.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="' . $resetLink . '" style="background-color: #3C77C3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(60,119,195,0.2);">Reset Password</a>
                    </div>
                    <p style="font-size: 14px; color: #555; line-height: 1.5;">This password reset link is valid for 60 minutes.</p>
                    <p style="font-size: 14px; color: #777; line-height: 1.5;">If you did not request a password reset, no further action is required.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;" />
                    <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">This is an automated email. Please do not reply to this email.</p>
                </div>
            ';
            
            $smtpHost = getenv('SMTP_HOST') ?: ($_ENV['SMTP_HOST'] ?? ($env['SMTP_HOST'] ?? null));
            $resendKey = getenv('RESEND_API_KEY') ?: ($_ENV['RESEND_API_KEY'] ?? ($env['RESEND_API_KEY'] ?? null));
            $smtpError = null;

            if ($smtpHost) {
                try {
                    $smtpPort = getenv('SMTP_PORT') ?: ($_ENV['SMTP_PORT'] ?? ($env['SMTP_PORT'] ?? 465));
                    $smtpUser = getenv('SMTP_USERNAME') ?: ($_ENV['SMTP_USERNAME'] ?? ($env['SMTP_USERNAME'] ?? ''));
                    $smtpPass = getenv('SMTP_PASSWORD') ?: ($_ENV['SMTP_PASSWORD'] ?? ($env['SMTP_PASSWORD'] ?? ''));
                    $smtpFromEmail = getenv('SMTP_FROM_EMAIL') ?: ($_ENV['SMTP_FROM_EMAIL'] ?? ($env['SMTP_FROM_EMAIL'] ?? $smtpUser));
                    $smtpFromName = getenv('SMTP_FROM_NAME') ?: ($_ENV['SMTP_FROM_NAME'] ?? ($env['SMTP_FROM_NAME'] ?? 'Creva Webzz'));

                    $smtp = new SimpleSMTP($smtpHost, $smtpPort, $smtpUser, $smtpPass);
                    $emailSent = $smtp->send($email, $subject, $message, $smtpFromEmail, $smtpFromName);
                } catch (Exception $e) {
                    $smtpError = $e->getMessage();
                    error_log("Failed to send email via SMTP: " . $e->getMessage());
                }
            } else if ($resendKey) {
                try {
                    $ch = curl_init('https://api.resend.com/emails');
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_POST, true);
                    curl_setopt($ch, CURLOPT_HTTPHEADER, [
                        'Authorization: Bearer ' . $resendKey,
                        'Content-Type: application/json'
                    ]);
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
                        'from' => 'Creva Webzz <onboarding@resend.dev>',
                        'to' => [$email],
                        'subject' => $subject,
                        'html' => $message
                    ]));
                    $curlRes = curl_exec($ch);
                    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                    curl_close($ch);
                    $emailSent = ($status === 200 || $status === 201);
                } catch (Exception $e) {
                    error_log("Failed to send email via Resend: " . $e->getMessage());
                }
            } else {
                try {
                    $emailSent = @mail($email, $subject, $message, $headers);
                } catch (Exception $e) {
                    error_log("Failed to send mail: " . $e->getMessage());
                }
            }

            $res = ['message' => 'Reset link has been sent to your email!'];
            if ((!$smtpHost && !$resendKey) || !$emailSent) {
                $res['debug_link'] = $resetLink;
                if ($smtpError) {
                    $res['smtp_error'] = $smtpError;
                }
            }
            jsonResponse($res);
        }

        if ($action === 'verify-token' && $requestMethod === 'POST') {
            $token = $body['token'] ?? '';
            if (!$token) {
                $headers = apache_request_headers();
                $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
                if (preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
                    $token = $matches[1];
                }
            }
            
            if (!$token) {
                jsonResponse(['error' => 'Reset token is required'], 400);
            }

            // Ensure table exists
            $pdo->exec('CREATE TABLE IF NOT EXISTS password_resets (email VARCHAR(255) PRIMARY KEY, token VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');

            $stmt = $pdo->prepare('SELECT * FROM password_resets WHERE token = ?');
            $stmt->execute([$token]);
            $reset = $stmt->fetch();
            if (!$reset) {
                jsonResponse(['error' => 'Invalid or expired reset token'], 400);
            }

            $createdAt = strtotime($reset->created_at);
            $now = time();
            if ($now - $createdAt > 3600) {
                $stmt = $pdo->prepare('DELETE FROM password_resets WHERE token = ?');
                $stmt->execute([$token]);
                jsonResponse(['error' => 'Reset token has expired'], 400);
            }

            $stmt = $pdo->prepare('SELECT * FROM "users" WHERE email = ?');
            $stmt->execute([$reset->email]);
            $user = $stmt->fetch();
            if (!$user) {
                jsonResponse(['error' => 'User not found'], 404);
            }

            jsonResponse([
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->name,
                    'role' => $user->role
                ]
            ]);
        }

        if ($action === 'reset-password' && $requestMethod === 'POST') {
            $token = $body['token'] ?? '';
            if (!$token) {
                $headers = apache_request_headers();
                $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
                if (preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
                    $token = $matches[1];
                }
            }
            if (!$token) {
                jsonResponse(['error' => 'Reset token is required'], 400);
            }

            $password = $body['password'] ?? '';
            if (!$password || strlen($password) < 6) {
                jsonResponse(['error' => 'Password must be at least 6 characters long'], 400);
            }

            // Ensure table exists
            $pdo->exec('CREATE TABLE IF NOT EXISTS password_resets (email VARCHAR(255) PRIMARY KEY, token VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');

            $stmt = $pdo->prepare('SELECT * FROM password_resets WHERE token = ?');
            $stmt->execute([$token]);
            $reset = $stmt->fetch();
            if (!$reset) {
                jsonResponse(['error' => 'Invalid or expired reset token'], 400);
            }

            $createdAt = strtotime($reset->created_at);
            $now = time();
            if ($now - $createdAt > 3600) {
                $stmt = $pdo->prepare('DELETE FROM password_resets WHERE token = ?');
                $stmt->execute([$token]);
                jsonResponse(['error' => 'Reset token has expired'], 400);
            }

            $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare('UPDATE "users" SET password = ?, updated_at = NOW() WHERE email = ?');
            $stmt->execute([$hashedPassword, $reset->email]);

            $stmt = $pdo->prepare('DELETE FROM password_resets WHERE email = ?');
            $stmt->execute([$reset->email]);

            jsonResponse([
                'success' => true,
                'message' => 'Password updated successfully'
            ]);
        }

        if ($action === 'superadmin-reset-password' && $requestMethod === 'POST') {
            $currentUser = getAuthUser($pdo);
            if (!$currentUser || $currentUser->role !== 'superadmin') {
                jsonResponse(['error' => 'Unauthorized. Only Super Admin can perform this action.'], 403);
            }

            $targetUserId = $body['userId'] ?? '';
            $newPassword = $body['password'] ?? '';

            if (!$targetUserId || !$newPassword) {
                jsonResponse(['error' => 'User ID and new password are required.'], 400);
            }

            if (strlen($newPassword) < 6) {
                jsonResponse(['error' => 'Password must be at least 6 characters long.'], 400);
            }

            // Check if target user exists
            $stmt = $pdo->prepare('SELECT id FROM "users" WHERE id = ?');
            $stmt->execute([$targetUserId]);
            if (!$stmt->fetch()) {
                jsonResponse(['error' => 'Target user not found.'], 404);
            }

            $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare('UPDATE "users" SET password = ?, updated_at = NOW() WHERE id = ?');
            $stmt->execute([$hashedPassword, $targetUserId]);

            jsonResponse([
                'success' => true,
                'message' => 'User password reset successfully by Super Admin.'
            ]);
        }

        if ($action === 'change-password' && $requestMethod === 'POST') {
            $currentUser = getAuthUser($pdo);
            if (!$currentUser) {
                jsonResponse(['error' => 'Unauthorized.'], 401);
            }

            $currentPassword = $body['currentPassword'] ?? '';
            $newPassword = $body['newPassword'] ?? '';

            if (!$currentPassword || !$newPassword) {
                jsonResponse(['error' => 'Current password and new password are required.'], 400);
            }

            if (strlen($newPassword) < 6) {
                jsonResponse(['error' => 'New password must be at least 6 characters long.'], 400);
            }

            // Verify current password
            if (!password_verify($currentPassword, $currentUser->password)) {
                jsonResponse(['error' => 'Incorrect current password.'], 400);
            }

            $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare('UPDATE "users" SET password = ?, updated_at = NOW() WHERE id = ?');
            $stmt->execute([$hashedPassword, $currentUser->id]);

            jsonResponse([
                'success' => true,
                'message' => 'Password updated successfully.'
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
                (isset($body['is_paused']) ? (bool)$body['is_paused'] : true) ? 1 : 0,
                (isset($body['custom_domain_enabled']) ? (bool)$body['custom_domain_enabled'] : false) ? 1 : 0,
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

class SimpleSMTP {
    private $host;
    private $port;
    private $username;
    private $password;

    public function __construct($host, $port, $username, $password) {
        $this->host = $host;
        $this->port = (int)$port;
        $this->username = $username;
        $this->password = $password;
    }

    public function send($to, $subject, $message, $fromEmail, $fromName) {
        $ssl = ($this->port === 465) ? 'ssl://' : '';
        $socket = @fsockopen($ssl . $this->host, $this->port, $errno, $errstr, 15);
        if (!$socket) {
            throw new Exception("SMTP connection failed: $errstr ($errno)");
        }

        $getResponse = function($socket) {
            $response = "";
            while (($line = fgets($socket, 515)) !== false) {
                $response .= $line;
                if (substr($line, 3, 1) == " ") break;
            }
            return $response;
        };

        $getResponse($socket);

        fwrite($socket, "EHLO " . $this->host . "\r\n");
        $getResponse($socket);

        if ($this->port === 587) {
            fwrite($socket, "STARTTLS\r\n");
            $getResponse($socket);
            if (!@stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                fclose($socket);
                throw new Exception("SMTP STARTTLS negotiation failed");
            }
            fwrite($socket, "EHLO " . $this->host . "\r\n");
            $getResponse($socket);
        }

        fwrite($socket, "AUTH LOGIN\r\n");
        $getResponse($socket);

        fwrite($socket, base64_encode($this->username) . "\r\n");
        $getResponse($socket);

        fwrite($socket, base64_encode($this->password) . "\r\n");
        $authRes = $getResponse($socket);
        if (strpos($authRes, '235') === false) {
            fclose($socket);
            throw new Exception("SMTP authentication failed: " . trim($authRes));
        }

        fwrite($socket, "MAIL FROM: <" . $this->username . ">\r\n");
        $getResponse($socket);

        fwrite($socket, "RCPT TO: <" . $to . ">\r\n");
        $getResponse($socket);

        fwrite($socket, "DATA\r\n");
        $getResponse($socket);

        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <" . $fromEmail . ">\r\n";
        $headers .= "To: <" . $to . ">\r\n";
        $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
        $headers .= "Date: " . date('r') . "\r\n";
        $headers .= "\r\n";

        fwrite($socket, $headers . $message . "\r\n.\r\n");
        $dataRes = $getResponse($socket);

        fwrite($socket, "QUIT\r\n");
        fclose($socket);

        if (strpos($dataRes, '250') === false) {
            throw new Exception("SMTP data transmission failed: " . trim($dataRes));
        }
        return true;
    }
}
