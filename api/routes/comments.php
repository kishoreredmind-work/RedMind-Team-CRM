<?php
// Task Comments Route

$currentUser = getAuthenticatedUser();

if ($method === 'GET') {
    $taskId = $_GET['taskId'] ?? null;
    if (!$taskId) {
        respond(false, null, 'Task ID is required');
    }

    // Verify task existence and check if user has access to this project
    $taskStmt = $conn->prepare("SELECT project_id FROM tasks WHERE id = ?");
    $taskStmt->bind_param("s", $taskId);
    $taskStmt->execute();
    $task = $taskStmt->get_result()->fetch_assoc();

    if (!$task) {
        respond(false, null, 'Task not found');
    }

    $projectId = $task['project_id'];

    if ($currentUser['role'] !== 'LEAD') {
        // Must be member of the project
        $memberStmt = $conn->prepare("SELECT 1 FROM project_members WHERE project_id = ? AND member_id = ?");
        $memberStmt->bind_param("ss", $projectId, $currentUser['user_id']);
        $memberStmt->execute();
        if ($memberStmt->get_result()->num_rows === 0) {
            respond(false, null, 'Forbidden: You do not have access to this project');
        }
    }

    // Fetch comments
    $stmt = $conn->prepare("SELECT c.id, c.task_id as taskId, c.content, c.created_at as createdAt, u.name as userName, u.id as userId FROM comments c JOIN users u ON c.user_id = u.id WHERE c.task_id = ? ORDER BY c.created_at ASC");
    $stmt->bind_param("s", $taskId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $comments = [];
    while ($row = $result->fetch_assoc()) {
        $comments[] = $row;
    }

    respond(true, $comments);
}

elseif ($method === 'POST') {
    $taskId = $input['taskId'] ?? null;
    $content = $input['content'] ?? null;

    if (!$taskId || !$content) {
        respond(false, null, 'Task ID and content are required');
    }

    // Verify task & access
    $taskStmt = $conn->prepare("SELECT title, project_id FROM tasks WHERE id = ?");
    $taskStmt->bind_param("s", $taskId);
    $taskStmt->execute();
    $task = $taskStmt->get_result()->fetch_assoc();

    if (!$task) {
        respond(false, null, 'Task not found');
    }

    $projectId = $task['project_id'];

    if ($currentUser['role'] !== 'LEAD') {
        $memberStmt = $conn->prepare("SELECT 1 FROM project_members WHERE project_id = ? AND member_id = ?");
        $memberStmt->bind_param("ss", $projectId, $currentUser['user_id']);
        $memberStmt->execute();
        if ($memberStmt->get_result()->num_rows === 0) {
            respond(false, null, 'Forbidden: Access denied');
        }
    }

    $id = generateUUID();
    $userId = $currentUser['user_id'];

    $stmt = $conn->prepare("INSERT INTO comments (id, task_id, user_id, content) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $id, $taskId, $userId, $content);

    if ($stmt->execute()) {
        logActivity($conn, $userId, 'ADD_COMMENT', "Added comment to task '" . $task['title'] . "'");
        respond(true, ['id' => $id, 'taskId' => $taskId, 'content' => $content, 'userId' => $userId, 'userName' => $currentUser['name'] ?? 'User'], null, 'Comment posted successfully');
    } else {
        respond(false, null, 'Failed to post comment');
    }
}

else {
    respond(false, null, 'Method not allowed');
}
