<?php
// Comments routes

if ($method === 'GET' && $resource === 'task' && $id) {
    // Get comments by task
    $stmt = $conn->prepare("SELECT id, task_id as taskId, user_id as userId, content, created_at as createdAt, updated_at as updatedAt FROM comments WHERE task_id = ? ORDER BY created_at DESC");
    $stmt->bind_param("s", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $comments = [];
    
    while ($row = $result->fetch_assoc()) {
        $comments[] = $row;
    }
    
    respond(true, $comments);
}

elseif ($method === 'POST') {
    // Create comment
    $taskId = $input['taskId'] ?? null;
    $userId = $input['userId'] ?? null;
    $content = $input['content'] ?? null;
    
    if (!$taskId || !$userId || !$content) {
        respond(false, null, 'Missing required fields');
    }
    
    $commentId = generateUUID();
    
    $stmt = $conn->prepare("INSERT INTO comments (id, task_id, user_id, content) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $commentId, $taskId, $userId, $content);
    
    if ($stmt->execute()) {
        respond(true, ['id' => $commentId], null, 'Comment created successfully');
    } else {
        respond(false, null, 'Failed to create comment');
    }
}

elseif ($method === 'DELETE' && $id) {
    // Delete comment
    $stmt = $conn->prepare("DELETE FROM comments WHERE id = ?");
    $stmt->bind_param("s", $id);
    
    if ($stmt->execute()) {
        respond(true, null, null, 'Comment deleted successfully');
    } else {
        respond(false, null, 'Failed to delete comment');
    }
}

else {
    respond(false, null, 'Invalid comments endpoint');
}
?>
