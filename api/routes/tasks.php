<?php
// Tasks routes

if ($method === 'GET' && !$id && $resource !== 'project') {
    // Get all tasks
    $result = $conn->query("SELECT id, title, project_id as projectId, assigned_to as assignedTo, status, priority, notes FROM tasks ORDER BY created_at DESC");
    $tasks = [];
    
    while ($row = $result->fetch_assoc()) {
        $tasks[] = $row;
    }
    
    respond(true, $tasks);
}

elseif ($method === 'GET' && $resource === 'project' && $id) {
    // Get tasks by project
    $stmt = $conn->prepare("SELECT id, title, project_id as projectId, assigned_to as assignedTo, status, priority, notes FROM tasks WHERE project_id = ? ORDER BY created_at DESC");
    $stmt->bind_param("s", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $tasks = [];
    
    while ($row = $result->fetch_assoc()) {
        $tasks[] = $row;
    }
    
    respond(true, $tasks);
}

elseif ($method === 'GET' && $id) {
    // Get single task
    $stmt = $conn->prepare("SELECT id, title, project_id as projectId, assigned_to as assignedTo, status, priority, notes FROM tasks WHERE id = ?");
    $stmt->bind_param("s", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        respond(false, null, 'Task not found');
    }
    
    respond(true, $result->fetch_assoc());
}

elseif ($method === 'POST') {
    // Create task
    $title = $input['title'] ?? null;
    $projectId = $input['projectId'] ?? null;
    $assignedTo = $input['assignedTo'] ?? null;
    $status = $input['status'] ?? 'TODO';
    $priority = $input['priority'] ?? 'MEDIUM';
    $notes = $input['notes'] ?? null;
    
    if (!$title || !$projectId) {
        respond(false, null, 'Title and projectId are required');
    }
    
    $taskId = generateUUID();
    
    $stmt = $conn->prepare("INSERT INTO tasks (id, title, project_id, assigned_to, status, priority, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssssss", $taskId, $title, $projectId, $assignedTo, $status, $priority, $notes);
    
    if ($stmt->execute()) {
        respond(true, ['id' => $taskId], null, 'Task created successfully');
    } else {
        respond(false, null, 'Failed to create task');
    }
}

elseif ($method === 'PUT' && $id) {
    // Update task
    $title = $input['title'] ?? null;
    $projectId = $input['projectId'] ?? null;
    $assignedTo = $input['assignedTo'] ?? null;
    $status = $input['status'] ?? null;
    $priority = $input['priority'] ?? null;
    $notes = $input['notes'] ?? null;
    
    $stmt = $conn->prepare("UPDATE tasks SET title = COALESCE(?, title), project_id = COALESCE(?, project_id), assigned_to = COALESCE(?, assigned_to), status = COALESCE(?, status), priority = COALESCE(?, priority), notes = COALESCE(?, notes) WHERE id = ?");
    $stmt->bind_param("sssssss", $title, $projectId, $assignedTo, $status, $priority, $notes, $id);
    
    if ($stmt->execute()) {
        respond(true, null, null, 'Task updated successfully');
    } else {
        respond(false, null, 'Failed to update task');
    }
}

elseif ($method === 'DELETE' && $id) {
    // Delete task
    $stmt = $conn->prepare("DELETE FROM tasks WHERE id = ?");
    $stmt->bind_param("s", $id);
    
    if ($stmt->execute()) {
        respond(true, null, null, 'Task deleted successfully');
    } else {
        respond(false, null, 'Failed to delete task');
    }
}

else {
    respond(false, null, 'Invalid tasks endpoint');
}
?>
