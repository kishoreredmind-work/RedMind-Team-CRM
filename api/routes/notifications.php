<?php
// Notifications routes

$currentUser = getAuthenticatedUser();

if ($method === 'GET') {
    // Get notifications for logged-in user
    $stmt = $conn->prepare("SELECT id, user_id as userId, message, link, is_read as isRead, created_at as createdAt FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50");
    $stmt->bind_param("s", $currentUser['user_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    $notifications = [];
    
    while ($row = $result->fetch_assoc()) {
        $row['isRead'] = (bool)$row['isRead'];
        $notifications[] = $row;
    }
    
    respond(true, $notifications);
}

elseif ($method === 'PUT') {
    if ($id) {
        // Mark specific notification as read
        $stmt = $conn->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ss", $id, $currentUser['user_id']);
        
        if ($stmt->execute()) {
            respond(true, null, null, 'Notification marked as read');
        } else {
            respond(false, null, 'Failed to update notification');
        }
    } else {
        // Mark all as read
        $stmt = $conn->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?");
        $stmt->bind_param("s", $currentUser['user_id']);
        
        if ($stmt->execute()) {
            respond(true, null, null, 'All notifications marked as read');
        } else {
            respond(false, null, 'Failed to update notifications');
        }
    }
}

else {
    respond(false, null, 'Invalid notifications endpoint');
}
?>
