<?php
// Work logs routes

$currentUser = getAuthenticatedUser();

if ($method === 'GET' && !$id && $resource !== 'user') {
    // Get all work logs (Leads see all, Members see only their own)
    if ($currentUser['role'] === 'LEAD') {
        $result = $conn->query("SELECT id, user_id as userId, task_id as taskId, date, hours, description FROM work_logs ORDER BY date DESC");
    } else {
        $stmt = $conn->prepare("SELECT id, user_id as userId, task_id as taskId, date, hours, description 
                                FROM work_logs 
                                WHERE user_id = ? 
                                ORDER BY date DESC");
        $stmt->bind_param("s", $currentUser['user_id']);
        $stmt->execute();
        $result = $stmt->get_result();
    }
    $logs = [];
    
    while ($row = $result->fetch_assoc()) {
        $logs[] = $row;
    }
    
    respond(true, $logs);
}

elseif ($method === 'GET' && $resource === 'user' && $id) {
    // Get work logs by user (Members can only fetch their own)
    if ($currentUser['role'] !== 'LEAD' && $id !== $currentUser['user_id']) {
        respond(false, null, 'Forbidden: Access denied to these logs');
    }
    
    $stmt = $conn->prepare("SELECT id, user_id as userId, task_id as taskId, date, hours, description FROM work_logs WHERE user_id = ? ORDER BY date DESC");
    $stmt->bind_param("s", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $logs = [];
    
    while ($row = $result->fetch_assoc()) {
        $logs[] = $row;
    }
    
    respond(true, $logs);
}

elseif ($method === 'GET' && $id) {
    // Get single work log
    $stmt = $conn->prepare("SELECT id, user_id as userId, task_id as taskId, date, hours, description FROM work_logs WHERE id = ?");
    $stmt->bind_param("s", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        respond(false, null, 'Work log not found');
    }
    
    $log = $result->fetch_assoc();
    
    if ($currentUser['role'] !== 'LEAD' && $log['userId'] !== $currentUser['user_id']) {
        respond(false, null, 'Forbidden: Access denied to this log');
    }
    
    respond(true, $log);
}

elseif ($method === 'POST') {
    $userId = $input['userId'] ?? null;
    $taskId = $input['taskId'] ?? null;
    $date = $input['date'] ?? null;
    $hours = $input['hours'] ?? null;
    $description = $input['description'] ?? null;
    
    if (!$userId || !$taskId || !$date || !$hours) {
        respond(false, null, 'Missing required fields');
    }
    
    // Team Members can only create logs for themselves
    if ($currentUser['role'] !== 'LEAD' && $userId !== $currentUser['user_id']) {
        respond(false, null, 'Forbidden: Cannot log work for another user');
    }
    
    // Verify task assignment / project membership
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
    
    $logId = generateUUID();
    
    $stmt = $conn->prepare("INSERT INTO work_logs (id, user_id, task_id, date, hours, description) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssds", $logId, $userId, $taskId, $date, $hours, $description);
    
    if ($stmt->execute()) {
        respond(true, ['id' => $logId], null, 'Work log created successfully');
    } else {
        respond(false, null, 'Failed to create work log');
    }
}

elseif ($method === 'PUT' && $id) {
    // Check ownership
    $logStmt = $conn->prepare("SELECT user_id FROM work_logs WHERE id = ?");
    $logStmt->bind_param("s", $id);
    $logStmt->execute();
    $log = $logStmt->get_result()->fetch_assoc();
    
    if (!$log) {
        respond(false, null, 'Work log not found');
    }
    
    if ($currentUser['role'] !== 'LEAD' && $log['user_id'] !== $currentUser['user_id']) {
        respond(false, null, 'Forbidden: Access denied');
    }
    
    $userId = $input['userId'] ?? null;
    $taskId = $input['taskId'] ?? null;
    $date = $input['date'] ?? null;
    $hours = $input['hours'] ?? null;
    $description = $input['description'] ?? null;
    
    // Prevent changing the user of the work log to someone else if not Lead
    if ($currentUser['role'] !== 'LEAD' && $userId !== null && $userId !== $currentUser['user_id']) {
        respond(false, null, 'Forbidden: Cannot change user assigned to log');
    }
    
    $stmt = $conn->prepare("UPDATE work_logs SET user_id = COALESCE(?, user_id), task_id = COALESCE(?, task_id), date = COALESCE(?, date), hours = COALESCE(?, hours), description = COALESCE(?, description) WHERE id = ?");
    
    $stmt->bind_param("ssssss", $userId, $taskId, $date, $hours, $description, $id);
    
    if ($stmt->execute()) {
        respond(true, null, null, 'Work log updated successfully');
    } else {
        respond(false, null, 'Failed to update work log');
    }
}

elseif ($method === 'DELETE' && $id) {
    // Check ownership
    $logStmt = $conn->prepare("SELECT user_id FROM work_logs WHERE id = ?");
    $logStmt->bind_param("s", $id);
    $logStmt->execute();
    $log = $logStmt->get_result()->fetch_assoc();
    
    if (!$log) {
        respond(false, null, 'Work log not found');
    }
    
    if ($currentUser['role'] !== 'LEAD' && $log['user_id'] !== $currentUser['user_id']) {
        respond(false, null, 'Forbidden: Access denied');
    }
    
    $stmt = $conn->prepare("DELETE FROM work_logs WHERE id = ?");
    $stmt->bind_param("s", $id);
    
    if ($stmt->execute()) {
        respond(true, null, null, 'Work log deleted successfully');
    } else {
        respond(false, null, 'Failed to delete work log');
    }
}

else {
    respond(false, null, 'Invalid work-logs endpoint');
}
?>
