<?php
// Work logs routes

if ($method === 'GET' && !$id && $resource !== 'user') {
    // Get all work logs
    $result = $conn->query("SELECT id, user_id as userId, task_id as taskId, date, hours, description FROM work_logs ORDER BY date DESC");
    $logs = [];
    
    while ($row = $result->fetch_assoc()) {
        $logs[] = $row;
    }
    
    respond(true, $logs);
}

elseif ($method === 'GET' && $resource === 'user' && $id) {
    // Get work logs by user
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
    
    respond(true, $result->fetch_assoc());
}

elseif ($method === 'POST') {
    // Create work log
    $userId = $input['userId'] ?? null;
    $taskId = $input['taskId'] ?? null;
    $date = $input['date'] ?? null;
    $hours = $input['hours'] ?? null;
    $description = $input['description'] ?? null;
    
    if (!$userId || !$taskId || !$date || !$hours) {
        respond(false, null, 'Missing required fields');
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
    // Update work log
    $userId = $input['userId'] ?? null;
    $taskId = $input['taskId'] ?? null;
    $date = $input['date'] ?? null;
    $hours = $input['hours'] ?? null;
    $description = $input['description'] ?? null;
    
    $stmt = $conn->prepare("UPDATE work_logs SET user_id = COALESCE(?, user_id), task_id = COALESCE(?, task_id), date = COALESCE(?, date), hours = COALESCE(?, hours), description = COALESCE(?, description) WHERE id = ?");
    
    if ($hours !== null) {
        $stmt->bind_param("sssdss", $userId, $taskId, $date, $hours, $description, $id);
    } else {
        $stmt->bind_param("ssssss", $userId, $taskId, $date, $description, $description, $id);
    }
    
    if ($stmt->execute()) {
        respond(true, null, null, 'Work log updated successfully');
    } else {
        respond(false, null, 'Failed to update work log');
    }
}

elseif ($method === 'DELETE' && $id) {
    // Delete work log
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
