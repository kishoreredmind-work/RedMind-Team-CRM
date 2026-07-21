<?php
// Load environment variables from .env file if it exists
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        // Skip comments and empty lines
        if (empty($line) || strpos($line, '#') === 0) {
            continue;
        }
        
        // Split by the first '=' character
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $key = trim($parts[0]);
            $val = trim($parts[1]);
            
            // Remove wrapping single or double quotes
            $val = preg_replace('/^([\'"])(.*)\1$/', '$2', $val);
            
            // Populate environment arrays
            if (!array_key_exists($key, $_SERVER) && !array_key_exists($key, $_ENV)) {
                putenv("{$key}={$val}");
                $_ENV[$key] = $val;
                $_SERVER[$key] = $val;
            }
        }
    }
}

// Database configuration (loads from environment variables, or falls back to defaults)
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASSWORD', getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : '');
define('DB_NAME', getenv('DB_NAME') ?: 'redmin_crm');
define('DB_PORT', (int)(getenv('DB_PORT') ?: 3306));

// Create connection
$conn = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT);

// Check connection
if ($conn->connect_error) {
    die(json_encode([
        'success' => false,
        'error' => 'Database connection failed: ' . $conn->connect_error
    ]));
}

// Set charset to utf8
$conn->set_charset("utf8");

// Helper function to return JSON response
function respond($success, $data = null, $error = null, $message = null) {
    $response = ['success' => $success];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    if ($error !== null) {
        $response['error'] = $error;
    }
    if ($message !== null) {
        $response['message'] = $message;
    }
    
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}

// Helper function to return JSON response immediately and continue executing in background
function respondAndContinue($success, $data = null, $error = null, $message = null) {
    $response = ['success' => $success];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    if ($error !== null) {
        $response['error'] = $error;
    }
    if ($message !== null) {
        $response['message'] = $message;
    }
    
    // Enable output buffering
    if (ob_get_level() == 0) ob_start();
    
    header('Content-Type: application/json');
    echo json_encode($response);
    
    $size = ob_get_length();
    header("Content-Length: $size");
    header("Connection: close");
    
    ob_end_flush();
    ob_flush();
    flush();
    
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    }
}

// Helper function to render a beautiful HTML email template with variables
function renderEmailTemplate($templateName, $variables = []) {
    $templateFile = __DIR__ . '/templates/' . $templateName . '.php';
    if (!file_exists($templateFile)) {
        return '';
    }
    
    extract($variables);
    ob_start();
    include $templateFile;
    return ob_get_clean();
}

// Helper function to generate UUID
function generateUUID() {
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// ----------------------------------------------------
// DB Migrations & Auto-setup
// ----------------------------------------------------
$conn->query("CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(255),
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)");

// Garbage collection lottery: 2% chance to clear read notifications older than 30 days
if (mt_rand(1, 100) <= 2) {
    $conn->query("DELETE FROM notifications WHERE is_read = 1 AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)");
}

// ----------------------------------------------------
// Authentication Helpers
// ----------------------------------------------------
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

function generateToken($userId, $role) {
    $secret = getenv('JWT_SECRET') ?: 'default_redmin_crm_secret_key_12345';
    $header = json_encode(['alg' => 'HS256', 'typ' => 'JWT']);
    $payload = json_encode([
        'user_id' => $userId,
        'role' => $role,
        'exp' => time() + (86400 * 30) // 30 days
    ]);
    
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

function verifyToken($token) {
    if (!$token) return null;
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    
    list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $parts;
    $secret = getenv('JWT_SECRET') ?: 'default_redmin_crm_secret_key_12345';
    
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    $expectedSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    if (!hash_equals($expectedSignature, $base64UrlSignature)) return null;
    
    $payload = json_decode(base64_decode(str_replace(['-','_'], ['+','/'], $base64UrlPayload)), true);
    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
        return null;
    }
    
    return $payload;
}

function getAuthenticatedUser() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = $matches[1];
        $payload = verifyToken($token);
        if ($payload) {
            return $payload;
        }
    }
    respond(false, null, 'Unauthorized: Invalid or missing token', null);
}

function requireLead() {
    $user = getAuthenticatedUser();
    if ($user['role'] !== 'LEAD') {
        respond(false, null, 'Forbidden: Lead privileges required', null);
    }
    return $user;
}

// ----------------------------------------------------
// Notifications Helper
// ----------------------------------------------------
function createNotification($conn, $userId, $message, $link = null) {
    $id = generateUUID();
    $stmt = $conn->prepare("INSERT INTO notifications (id, user_id, message, link) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $id, $userId, $message, $link);
    $stmt->execute();
}

// ----------------------------------------------------
// SMTP / Email Helper
// ----------------------------------------------------
function sendMailNotification($toEmail, $subject, $messageBody) {
    $smtpHost = getenv('SMTP_HOST');
    $smtpUser = getenv('SMTP_USER');
    $smtpPass = getenv('SMTP_PASS');
    $smtpPort = getenv('SMTP_PORT') ?: 587;
    $smtpSecure = getenv('SMTP_SECURE') ?: 'tls';
    $fromEmail = getenv('SMTP_FROM') ?: 'no-reply@mydomain.com';

    if (!$smtpHost) {
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "From: Redmin CRM <" . $fromEmail . ">\r\n";
        $headers .= "Reply-To: " . $fromEmail . "\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
        return @mail($toEmail, $subject, $messageBody, $headers);
    }

    try {
        $host = $smtpHost;
        if ($smtpSecure === 'ssl') {
            $host = 'ssl://' . $smtpHost;
        }

        $socket = @fsockopen($host, $smtpPort, $errno, $errstr, 15);
        if (!$socket) {
            error_log("SMTP connection failed: $errstr ($errno)");
            return false;
        }

        $readResponse = function($socket, $expected) {
            $response = '';
            while (substr($response, 3, 1) !== ' ') {
                $line = fgets($socket, 512);
                if ($line === false) break;
                $response .= $line;
            }
            $code = substr($response, 0, 3);
            if ($code != $expected) {
                error_log("SMTP Error: Expected $expected, got response: $response");
                return false;
            }
            return true;
        };

        if (!$readResponse($socket, 220)) { fclose($socket); return false; }

        fwrite($socket, "EHLO " . $_SERVER['SERVER_NAME'] . "\r\n");
        if (!$readResponse($socket, 250)) { fclose($socket); return false; }

        if ($smtpSecure === 'tls') {
            fwrite($socket, "STARTTLS\r\n");
            if (!$readResponse($socket, 220)) { fclose($socket); return false; }
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                error_log("SMTP Error: STARTTLS crypto enable failed");
                fclose($socket);
                return false;
            }
            fwrite($socket, "EHLO " . $_SERVER['SERVER_NAME'] . "\r\n");
            if (!$readResponse($socket, 250)) { fclose($socket); return false; }
        }

        if ($smtpUser && $smtpPass) {
            fwrite($socket, "AUTH LOGIN\r\n");
            if (!$readResponse($socket, 334)) { fclose($socket); return false; }
            fwrite($socket, base64_encode($smtpUser) . "\r\n");
            if (!$readResponse($socket, 334)) { fclose($socket); return false; }
            fwrite($socket, base64_encode($smtpPass) . "\r\n");
            if (!$readResponse($socket, 235)) { fclose($socket); return false; }
        }

        fwrite($socket, "MAIL FROM: <$fromEmail>\r\n");
        if (!$readResponse($socket, 250)) { fclose($socket); return false; }

        fwrite($socket, "RCPT TO: <$toEmail>\r\n");
        if (!$readResponse($socket, 250)) { fclose($socket); return false; }

        fwrite($socket, "DATA\r\n");
        if (!$readResponse($socket, 354)) { fclose($socket); return false; }

        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "From: Redmin CRM <$fromEmail>\r\n";
        $headers .= "To: <$toEmail>\r\n";
        $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
        $headers .= "Date: " . date('r') . "\r\n";
        $headers .= "\r\n";

        fwrite($socket, $headers . $messageBody . "\r\n.\r\n");
        if (!$readResponse($socket, 250)) { fclose($socket); return false; }

        fwrite($socket, "QUIT\r\n");
        fclose($socket);
        return true;
    } catch (Exception $e) {
        error_log("SMTP send exception: " . $e->getMessage());
        return false;
    }
}
?>
