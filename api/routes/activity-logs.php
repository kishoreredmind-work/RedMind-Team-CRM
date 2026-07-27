<?php
// Activity Logs Route

$currentUser = requireLead();

if ($method === 'GET') {
    $stmt = $conn->prepare("SELECT l.id, l.action, l.details, l.created_at as createdAt, u.name as userName FROM activity_logs l JOIN users u ON l.user_id = u.id ORDER BY l.created_at DESC LIMIT 100");
    $stmt->execute();
    $result = $stmt->get_result();

    $logs = [];
    while ($row = $result->fetch_assoc()) {
        $logs[] = $row;
    }

    respond(true, $logs);
} else {
    respond(false, null, 'Method not allowed');
}
