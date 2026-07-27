<?php
// Server-Sent Events (SSE) Notifications Route

header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('Access-Control-Allow-Origin: *');

// Disable output buffering
while (ob_get_level() > 0) {
    ob_end_clean();
}

$token = $_GET['token'] ?? null;
if (!$token) {
    echo "event: error\ndata: " . json_encode(['error' => 'Missing authentication token']) . "\n\n";
    exit;
}

$payload = verifyToken($token);
if (!$payload) {
    echo "event: error\ndata: " . json_encode(['error' => 'Invalid or expired token']) . "\n\n";
    exit;
}

$userId = $payload['user_id'];
$lastCheckTime = date('Y-m-d H:i:s', time() - 2); // Start checking from 2 seconds ago
$heartbeatTime = time();

// Keep streaming for 40 seconds, then exit gracefully to let client reconnect
$startTime = time();
while (time() - $startTime < 40) {
    if (connection_aborted()) {
        break;
    }

    // Retrieve notifications created after $lastCheckTime
    $stmt = $conn->prepare("SELECT id, message, link, is_read as isRead, created_at as createdAt FROM notifications WHERE user_id = ? AND created_at > ? ORDER BY created_at ASC");
    $stmt->bind_param("ss", $userId, $lastCheckTime);
    $stmt->execute();
    $result = $stmt->get_result();

    $found = false;
    while ($row = $result->fetch_assoc()) {
        echo "event: notification\n";
        echo "data: " . json_encode($row) . "\n\n";
        $lastCheckTime = $row['createdAt'];
        $found = true;
    }

    if ($found) {
        ob_flush();
        flush();
    }

    // Periodically send ping to prevent connection timeout
    if (time() - $heartbeatTime >= 8) {
        echo "event: ping\ndata: {}\n\n";
        ob_flush();
        flush();
        $heartbeatTime = time();
    }

    sleep(1.5);
}
