<?php
// Creva Webzz - PostgreSQL Schema Importer Tool
// Programmatically imports database.sql using PDO (No psql CLI needed!)

echo "🚀 Starting Creva Webzz PostgreSQL Schema Importer...\n";

$envFile = __DIR__ . '/.env';
if (!file_exists($envFile)) {
    die("❌ Error: .env file not found in " . __DIR__ . "\n");
}

// Simple parser for .env values
$env = [];
$lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
foreach ($lines as $line) {
    if (strpos(trim($line), '#') === 0) continue;
    $parts = explode('=', $line, 2);
    if (count($parts) === 2) {
        $env[trim($parts[0])] = trim($parts[1], " \t\n\r\0\x0B\"'");
    }
}

$driver = $env['DB_CONNECTION'] ?? 'pgsql';
$host = $env['DB_HOST'] ?? '127.0.0.1';
$port = $env['DB_PORT'] ?? '5432';
$dbname = $env['DB_DATABASE'] ?? 'creva_webzz';
$username = $env['DB_USERNAME'] ?? 'postgres';
$password = $env['DB_PASSWORD'] ?? '';

echo "📡 Connecting to Database: pgsql:host=$host;port=$port;dbname=$dbname;sslmode=require\n";

try {
    // Render requires sslmode=require for external connections
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;sslmode=require";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    echo "✅ Successfully connected to Render PostgreSQL!\n";
} catch (PDOException $e) {
    die("❌ Connection Failed: " . $e->getMessage() . "\n");
}

$sqlFile = __DIR__ . '/database.sql';
if (!file_exists($sqlFile)) {
    die("❌ Error: database.sql not found in " . __DIR__ . "\n");
}

$sqlContent = file_get_contents($sqlFile);
echo "📖 Read database.sql successfully (" . strlen($sqlContent) . " bytes).\n";

try {
    echo "⚡ Executing SQL schema and seeding data...\n";
    $pdo->exec($sqlContent);
    echo "🎉 Database schema and seeds imported successfully into Render PostgreSQL!\n";
} catch (PDOException $e) {
    die("❌ Import Failed: " . $e->getMessage() . "\n");
}
