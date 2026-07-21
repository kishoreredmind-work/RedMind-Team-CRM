<?php
// Comments routes

$currentUser = getAuthenticatedUser();

if ($method === 'GET' && $resource === 'task' && $id) {
    // Check task access
    $taskStmt = $conn->prepare("SELECT project_id, assigned_to FROM tasks WHERE id = ?");
    $taskStmt->bind_param("s", $id);
    $taskStmt->execute();
    $task = $taskStmt->get_result()->fetch_assoc();
    
    if (!$task) {
        respond(false, null, 'Task not found');
    }
    
    if ($currentUser['role'] !== 'LEAD' && $task['assigned_to'] !== $currentUser['user_id']) {
        $checkStmt = $conn->prepare("SELECT 1 FROM project_members WHERE project_id = ? AND member_id = ?");
        $checkStmt->bind_param("ss", $task['project_id'], $currentUser['user_id']);
        $checkStmt->execute();
        if ($checkStmt->get_result()->num_rows === 0) {
            respond(false, null, 'Forbidden: You do not have access to this task');
        }
    }
    
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
    
    // Team Members can only post comments as themselves
    if ($currentUser['role'] !== 'LEAD' && $userId !== $currentUser['user_id']) {
        respond(false, null, 'Forbidden: Cannot post comment as another user');
    }
    
    // Check task access
    $taskStmt = $conn->prepare("SELECT project_id, assigned_to FROM tasks WHERE id = ?");
    $taskStmt->bind_param("s", $taskId);
    $taskStmt->execute();
    $task = $taskStmt->get_result()->fetch_assoc();
    
    if (!$task) {
        respond(false, null, 'Task not found');
    }
    
    if ($currentUser['role'] !== 'LEAD' && $task['assigned_to'] !== $currentUser['user_id']) {
        $checkStmt = $conn->prepare("SELECT 1 FROM project_members WHERE project_id = ? AND member_id = ?");
        $checkStmt->bind_param("ss", $task['project_id'], $currentUser['user_id']);
        $checkStmt->execute();
        if ($checkStmt->get_result()->num_rows === 0) {
            respond(false, null, 'Forbidden: You do not have access to this task');
        }
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
    // Check ownership
    $comStmt = $conn->prepare("SELECT user_id FROM comments WHERE id = ?");
    $comStmt->bind_param("s", $id);
    $comStmt->execute();
    $comment = $comStmt->get_result()->fetch_assoc();
    
    if (!$comment) {
        respond(false, null, 'Comment not found');
    }
    
    if ($currentUser['role'] !== 'LEAD' && $comment['user_id'] !== $currentUser['user_id']) {
        respond(false, null, 'Forbidden: Cannot delete this comment');
    }
    
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
