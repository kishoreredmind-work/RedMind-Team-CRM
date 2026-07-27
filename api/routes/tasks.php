<?php
// Tasks routes

$currentUser = getAuthenticatedUser();

if ($method === 'GET' && !$id && $resource !== 'project') {
    // Get tasks (Leads see all, Members see tasks in their assigned projects or assigned directly to them)
    if ($currentUser['role'] === 'LEAD') {
        $result = $conn->query("SELECT id, title, project_id as projectId, assigned_to as assignedTo, status, priority, notes FROM tasks ORDER BY created_at DESC");
    } else {
        $stmt = $conn->prepare("SELECT DISTINCT t.id, t.title, t.project_id as projectId, t.assigned_to as assignedTo, t.status, t.priority, t.notes 
                                FROM tasks t
                                LEFT JOIN project_members pm ON t.project_id = pm.project_id
                                WHERE pm.member_id = ? OR t.assigned_to = ?
                                ORDER BY t.created_at DESC");
        $stmt->bind_param("ss", $currentUser['user_id'], $currentUser['user_id']);
        $stmt->execute();
        $result = $stmt->get_result();
    }
    
    $tasks = [];
    while ($row = $result->fetch_assoc()) {
        $tasks[] = $row;
    }
    
    respond(true, $tasks);
}

elseif ($method === 'GET' && $resource === 'project' && $id) {
    // Get tasks by project (restrict Members to assigned projects)
    if ($currentUser['role'] !== 'LEAD') {
        $checkStmt = $conn->prepare("SELECT 1 FROM project_members WHERE project_id = ? AND member_id = ?");
        $checkStmt->bind_param("ss", $id, $currentUser['user_id']);
        $checkStmt->execute();
        if ($checkStmt->get_result()->num_rows === 0) {
            respond(false, null, 'Forbidden: You do not have access to this project');
        }
    }
    
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
    
    $task = $result->fetch_assoc();
    
    // Check access
    if ($currentUser['role'] !== 'LEAD' && $task['assignedTo'] !== $currentUser['user_id']) {
        $checkStmt = $conn->prepare("SELECT 1 FROM project_members WHERE project_id = ? AND member_id = ?");
        $checkStmt->bind_param("ss", $task['projectId'], $currentUser['user_id']);
        $checkStmt->execute();
        if ($checkStmt->get_result()->num_rows === 0) {
            respond(false, null, 'Forbidden: Access denied to this task');
        }
    }
    
    respond(true, $task);
}

elseif ($method === 'POST') {
    requireLead();
    
    $title = $input['title'] ?? null;
    $projectId = $input['projectId'] ?? null;
    $assignedTo = $input['assignedTo'] ?? null;
    $status = $input['status'] ?? 'To Do';
    $priority = $input['priority'] ?? 'Medium';
    $notes = $input['notes'] ?? null;
    
    if (!$title || !$projectId) {
        respond(false, null, 'Title and projectId are required');
    }
    
    $taskId = generateUUID();
    
    $stmt = $conn->prepare("INSERT INTO tasks (id, title, project_id, assigned_to, status, priority, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssssss", $taskId, $title, $projectId, $assignedTo, $status, $priority, $notes);
    
    if ($stmt->execute()) {
        $emailsToSend = [];
        // Trigger notification to assignee
        if ($assignedTo) {
            $msg = "You have been assigned to task: " . $title;
            createNotification($conn, $assignedTo, $msg, "tasks");
            
            // Email assignee
            $userStmt = $conn->prepare("SELECT email, name FROM users WHERE id = ?");
            $userStmt->bind_param("s", $assignedTo);
            $userStmt->execute();
            $uRes = $userStmt->get_result()->fetch_assoc();
            if ($uRes && $uRes['email']) {
                $emailsToSend[] = [
                    'to' => $uRes['email'],
                    'subject' => "New Task Assignment: " . $title,
                    'body' => renderEmailTemplate('task_assignment', [
                        'name' => $uRes['name'],
                        'taskTitle' => $title,
                        'loginUrl' => getEnvVar('VITE_API_URL') ?: 'https://mydomain.com'
                    ])
                ];
            }
        }
        logActivity($conn, $currentUser['user_id'], 'CREATE_TASK', "Allocated task segment: " . $title);
        respondAndContinue(true, ['id' => $taskId], null, 'Task created successfully');

        foreach ($emailsToSend as $mail) {
            sendMailNotification($mail['to'], $mail['subject'], $mail['body']);
        }
    } else {
        respond(false, null, 'Failed to create task');
    }
}

elseif ($method === 'PUT' && $id) {
    // Fetch current task state to see if there is an assignee change or status change
    $stateStmt = $conn->prepare("SELECT title, project_id, assigned_to, status FROM tasks WHERE id = ?");
    $stateStmt->bind_param("s", $id);
    $stateStmt->execute();
    $taskState = $stateStmt->get_result()->fetch_assoc();
    
    if (!$taskState) {
        respond(false, null, 'Task not found');
    }
    
    if ($currentUser['role'] === 'LEAD') {
        // Leads can update everything
        $title = $input['title'] ?? null;
        $projectId = $input['projectId'] ?? null;
        $assignedTo = $input['assignedTo'] ?? null;
        $status = $input['status'] ?? null;
        $priority = $input['priority'] ?? null;
        $notes = $input['notes'] ?? null;
        
        $stmt = $conn->prepare("UPDATE tasks SET title = COALESCE(?, title), project_id = COALESCE(?, project_id), assigned_to = ?, status = COALESCE(?, status), priority = COALESCE(?, priority), notes = COALESCE(?, notes) WHERE id = ?");
        $stmt->bind_param("sssssss", $title, $projectId, $assignedTo, $status, $priority, $notes, $id);
        
        if ($stmt->execute()) {
            $taskTitle = $title ?: $taskState['title'];
            $emailsToSend = [];
            // Trigger assignment notifications if assignee changed
            if ($assignedTo && $assignedTo !== $taskState['assigned_to']) {
                $msg = "You have been assigned to task: " . $taskTitle;
                createNotification($conn, $assignedTo, $msg, "tasks");
                
                $userStmt = $conn->prepare("SELECT email, name FROM users WHERE id = ?");
                $userStmt->bind_param("s", $assignedTo);
                $userStmt->execute();
                $uRes = $userStmt->get_result()->fetch_assoc();
                if ($uRes && $uRes['email']) {
                    $emailsToSend[] = [
                        'to' => $uRes['email'],
                        'subject' => "New Task Assignment: " . $taskTitle,
                        'body' => renderEmailTemplate('task_assignment', [
                            'name' => $uRes['name'],
                            'taskTitle' => $taskTitle,
                            'loginUrl' => getEnvVar('VITE_API_URL') ?: 'https://mydomain.com'
                        ])
                    ];
                }
            }
            logActivity($conn, $currentUser['user_id'], 'UPDATE_TASK', "Updated task: " . $taskTitle);
            respondAndContinue(true, null, null, 'Task updated successfully');

            foreach ($emailsToSend as $mail) {
                sendMailNotification($mail['to'], $mail['subject'], $mail['body']);
            }
        } else {
            respond(false, null, 'Failed to update task');
        }
    } else {
        // Team Members can ONLY update task status (and notes) if they are assigned or in project
        if ($taskState['assigned_to'] !== $currentUser['user_id']) {
            $checkStmt = $conn->prepare("SELECT 1 FROM project_members WHERE project_id = ? AND member_id = ?");
            $checkStmt->bind_param("ss", $taskState['project_id'], $currentUser['user_id']);
            $checkStmt->execute();
            if ($checkStmt->get_result()->num_rows === 0) {
                respond(false, null, 'Forbidden: You are not assigned to this task');
            }
        }
        
        $status = $input['status'] ?? null;
        $notes = $input['notes'] ?? null;
        
        $stmt = $conn->prepare("UPDATE tasks SET status = COALESCE(?, status), notes = COALESCE(?, notes) WHERE id = ?");
        $stmt->bind_param("sss", $status, $notes, $id);
        
        if ($stmt->execute()) {
            $emailsToSend = [];
            // If status changed, notify the LEADs
            if ($status && $status !== $taskState['status']) {
                $leadsResult = $conn->query("SELECT id, email, name FROM users WHERE role = 'LEAD'");
                
                // Fetch member name
                $memStmt = $conn->prepare("SELECT name FROM users WHERE id = ?");
                $memStmt->bind_param("s", $currentUser['user_id']);
                $memStmt->execute();
                $memName = $memStmt->get_result()->fetch_assoc()['name'] ?? 'Team Member';
                
                while ($lead = $leadsResult->fetch_assoc()) {
                    $msg = $memName . " updated task status to '" . $status . "': " . $taskState['title'];
                    createNotification($conn, $lead['id'], $msg, "tasks");
                    
                    if ($lead['email']) {
                        $emailsToSend[] = [
                            'to' => $lead['email'],
                            'subject' => "Task Update Alert: " . $taskState['title'],
                            'body' => renderEmailTemplate('task_status_update', [
                                'leadName' => $lead['name'],
                                'taskTitle' => $taskState['title'],
                                'memberName' => $memName,
                                'status' => $status,
                                'loginUrl' => getEnvVar('VITE_API_URL') ?: 'https://mydomain.com'
                            ])
                        ];
                    }
                }
            }
            logActivity($conn, $currentUser['user_id'], 'UPDATE_TASK_STATUS', "Updated status to '" . ($status ?: $taskState['status']) . "' for task: " . $taskState['title']);
            respondAndContinue(true, null, null, 'Task updated successfully');

            foreach ($emailsToSend as $mail) {
                sendMailNotification($mail['to'], $mail['subject'], $mail['body']);
            }
        } else {
            respond(false, null, 'Failed to update task');
        }
    }
}

elseif ($method === 'DELETE' && $id) {
    requireLead();
    
    // Fetch task details for logging before deleting
    $nStmt = $conn->prepare("SELECT title FROM tasks WHERE id = ?");
    $nStmt->bind_param("s", $id);
    $nStmt->execute();
    $tDetails = $nStmt->get_result()->fetch_assoc();
    $taskTitle = $tDetails['title'] ?? 'Unknown Task';

    $stmt = $conn->prepare("DELETE FROM tasks WHERE id = ?");
    $stmt->bind_param("s", $id);
    
    if ($stmt->execute()) {
        logActivity($conn, $currentUser['user_id'], 'DELETE_TASK', "Deleted task: " . $taskTitle);
        respond(true, null, null, 'Task deleted successfully');
    } else {
        respond(false, null, 'Failed to delete task');
    }
}

else {
    respond(false, null, 'Invalid tasks endpoint');
}
?>
