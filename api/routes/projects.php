<?php
// Projects routes

$currentUser = getAuthenticatedUser();

if ($method === 'GET' && !$id) {
    // Get projects (Leads see all, Members see assigned only)
    if ($currentUser['role'] === 'LEAD') {
        $query = "SELECT p.id, p.name, p.description, p.client_id as clientId, p.status, p.start_date as startDate, p.end_date as deadline, p.working_days as workingDays, p.links, p.created_by FROM projects p ORDER BY p.created_at DESC";
        $result = $conn->query($query);
    } else {
        $stmt = $conn->prepare("SELECT p.id, p.name, p.description, p.client_id as clientId, p.status, p.start_date as startDate, p.end_date as deadline, p.working_days as workingDays, p.links, p.created_by 
                                FROM projects p 
                                INNER JOIN project_members pm ON p.id = pm.project_id 
                                WHERE pm.member_id = ? 
                                ORDER BY p.created_at DESC");
        $stmt->bind_param("s", $currentUser['user_id']);
        $stmt->execute();
        $result = $stmt->get_result();
    }
    
    $projects = [];
    while ($row = $result->fetch_assoc()) {
        if ($row['links']) {
            $row['links'] = json_decode($row['links'], true);
        }
        $projects[] = $row;
    }
    
    respond(true, $projects);
}

elseif ($method === 'GET' && $id) {
    // Get single project with members
    $stmt = $conn->prepare("SELECT p.id, p.name, p.description, p.client_id as clientId, p.status, p.start_date as startDate, p.end_date as deadline, p.working_days as workingDays, p.links, p.created_by FROM projects p WHERE p.id = ?");
    $stmt->bind_param("s", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        respond(false, null, 'Project not found');
    }
    
    $project = $result->fetch_assoc();
    
    // Team Members can only access their assigned projects
    if ($currentUser['role'] !== 'LEAD') {
        $checkStmt = $conn->prepare("SELECT 1 FROM project_members WHERE project_id = ? AND member_id = ?");
        $checkStmt->bind_param("ss", $id, $currentUser['user_id']);
        $checkStmt->execute();
        if ($checkStmt->get_result()->num_rows === 0) {
            respond(false, null, 'Forbidden: You are not assigned to this project');
        }
    }
    
    if ($project['links']) {
        $project['links'] = json_decode($project['links'], true);
    }
    
    // Get project members
    $stmt = $conn->prepare("SELECT member_id FROM project_members WHERE project_id = ?");
    $stmt->bind_param("s", $id);
    $stmt->execute();
    $members_result = $stmt->get_result();
    $project['assignedMemberIds'] = [];
    
    while ($row = $members_result->fetch_assoc()) {
        $project['assignedMemberIds'][] = $row['member_id'];
    }
    
    respond(true, $project);
}

elseif ($method === 'POST') {
    requireLead();
    
    $name = $input['name'] ?? null;
    $description = $input['description'] ?? null;
    $clientId = $input['clientId'] ?? null;
    $status = $input['status'] ?? 'PENDING';
    $startDate = $input['startDate'] ?? null;
    $deadline = $input['deadline'] ?? null;
    $workingDays = $input['workingDays'] ?? null;
    $links = $input['links'] ?? null;
    $created_by = $currentUser['user_id'];
    $assignedMemberIds = $input['assignedMemberIds'] ?? [];
    
    if (!$name) {
        respond(false, null, 'Project name is required');
    }
    
    $projectId = generateUUID();
    $linksJson = json_encode($links ?? []);
    
    $stmt = $conn->prepare("INSERT INTO projects (id, name, description, client_id, status, start_date, end_date, working_days, links, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssssssss", $projectId, $name, $description, $clientId, $status, $startDate, $deadline, $workingDays, $linksJson, $created_by);
    
    if ($stmt->execute()) {
        $emailsToSend = [];
        // Save members
        if (!empty($assignedMemberIds) && is_array($assignedMemberIds)) {
            foreach ($assignedMemberIds as $memberId) {
                $pmId = generateUUID();
                $pmStmt = $conn->prepare("INSERT INTO project_members (id, project_id, member_id) VALUES (?, ?, ?)");
                $pmStmt->bind_param("sss", $pmId, $projectId, $memberId);
                $pmStmt->execute();
                
                // In-app Notification
                $msg = "You have been assigned to project: " . $name;
                createNotification($conn, $memberId, $msg, "projects");
                
                // Email Notification
                $userStmt = $conn->prepare("SELECT email, name FROM users WHERE id = ?");
                $userStmt->bind_param("s", $memberId);
                $userStmt->execute();
                $uRes = $userStmt->get_result()->fetch_assoc();
                if ($uRes && $uRes['email']) {
                    $emailsToSend[] = [
                        'to' => $uRes['email'],
                        'subject' => "Assigned to Project: " . $name,
                        'body' => renderEmailTemplate('project_assignment', [
                            'name' => $uRes['name'],
                            'projectName' => $name,
                            'loginUrl' => getenv('VITE_API_URL') ?: 'https://mydomain.com'
                        ])
                    ];
                }
            }
        }
        respondAndContinue(true, ['id' => $projectId], null, 'Project created successfully');

        foreach ($emailsToSend as $mail) {
            sendMailNotification($mail['to'], $mail['subject'], $mail['body']);
        }
    } else {
        respond(false, null, 'Failed to create project');
    }
}

elseif ($method === 'PUT' && $id) {
    requireLead();
    
    $name = $input['name'] ?? null;
    $description = $input['description'] ?? null;
    $clientId = $input['clientId'] ?? null;
    $status = $input['status'] ?? null;
    $startDate = $input['startDate'] ?? null;
    $deadline = $input['deadline'] ?? null;
    $workingDays = $input['workingDays'] ?? null;
    $links = $input['links'] ?? null;
    $assignedMemberIds = $input['assignedMemberIds'] ?? [];
    
    $linksJson = $links ? json_encode($links) : null;
    
    $stmt = $conn->prepare("UPDATE projects SET name = COALESCE(?, name), description = COALESCE(?, description), client_id = COALESCE(?, client_id), status = COALESCE(?, status), start_date = COALESCE(?, start_date), end_date = COALESCE(?, end_date), working_days = COALESCE(?, working_days), links = COALESCE(?, links) WHERE id = ?");
    $stmt->bind_param("sssssssss", $name, $description, $clientId, $status, $startDate, $deadline, $workingDays, $linksJson, $id);
    
    if ($stmt->execute()) {
        // Fetch existing members
        $existingMembers = [];
        $eStmt = $conn->prepare("SELECT member_id FROM project_members WHERE project_id = ?");
        $eStmt->bind_param("s", $id);
        $eStmt->execute();
        $eRes = $eStmt->get_result();
        while ($row = $eRes->fetch_assoc()) {
            $existingMembers[] = $row['member_id'];
        }
        
        // Sync project_members
        $clearStmt = $conn->prepare("DELETE FROM project_members WHERE project_id = ?");
        $clearStmt->bind_param("s", $id);
        $emailsToSend = [];
        // Sync members
        if (is_array($assignedMemberIds)) {
            // Get current members
            $currentStmt = $conn->prepare("SELECT member_id FROM project_members WHERE project_id = ?");
            $currentStmt->bind_param("s", $id);
            $currentStmt->execute();
            $currentRes = $currentStmt->get_result();
            $currentMembers = [];
            while ($row = $currentRes->fetch_assoc()) {
                $currentMembers[] = $row['member_id'];
            }
            
            // Delete removed members
            $toDelete = array_diff($currentMembers, $assignedMemberIds);
            if (!empty($toDelete)) {
                $deleteStmt = $conn->prepare("DELETE FROM project_members WHERE project_id = ? AND member_id = ?");
                foreach ($toDelete as $mId) {
                    $deleteStmt->bind_param("ss", $id, $mId);
                    $deleteStmt->execute();
                }
            }
            
            // Add new members
            $toAdd = array_diff($assignedMemberIds, $currentMembers);
            if (!empty($toAdd)) {
                $insertStmt = $conn->prepare("INSERT INTO project_members (id, project_id, member_id) VALUES (?, ?, ?)");
                foreach ($toAdd as $memberId) {
                    $pmId = generateUUID();
                    $insertStmt->bind_param("sss", $pmId, $id, $memberId);
                    $insertStmt->execute();
                    
                    // Fetch project name
                    $projName = $name;
                    if (!$projName) {
                        $nameStmt = $conn->prepare("SELECT name FROM projects WHERE id = ?");
                        $nameStmt->bind_param("s", $id);
                        $nameStmt->execute();
                        $nRes = $nameStmt->get_result()->fetch_assoc();
                        $projName = $nRes['name'] ?? 'Unknown Project';
                    }
                    
                    $msg = "You have been assigned to project: " . $projName;
                    createNotification($conn, $memberId, $msg, "projects");
                    
                    $userStmt = $conn->prepare("SELECT email, name FROM users WHERE id = ?");
                    $userStmt->bind_param("s", $memberId);
                    $userStmt->execute();
                    $uRes = $userStmt->get_result()->fetch_assoc();
                    if ($uRes && $uRes['email']) {
                        $emailsToSend[] = [
                            'to' => $uRes['email'],
                            'subject' => "Assigned to Project: " . $projName,
                            'body' => renderEmailTemplate('project_assignment', [
                                'name' => $uRes['name'],
                                'projectName' => $projName,
                                'loginUrl' => getenv('VITE_API_URL') ?: 'https://mydomain.com'
                            ])
                        ];
                    }
                }
            }
        }
        
        respondAndContinue(true, null, null, 'Project updated successfully');

        foreach ($emailsToSend as $mail) {
            sendMailNotification($mail['to'], $mail['subject'], $mail['body']);
        }
    } else {
        respond(false, null, 'Failed to update project');
    }
}

elseif ($method === 'DELETE' && $id) {
    requireLead();
    
    // Clear project members first
    $clearStmt = $conn->prepare("DELETE FROM project_members WHERE project_id = ?");
    $clearStmt->bind_param("s", $id);
    $clearStmt->execute();
    
    $stmt = $conn->prepare("DELETE FROM projects WHERE id = ?");
    $stmt->bind_param("s", $id);
    
    if ($stmt->execute()) {
        respond(true, null, null, 'Project deleted successfully');
    } else {
        respond(false, null, 'Failed to delete project');
    }
}

else {
    respond(false, null, 'Invalid projects endpoint');
}
?>
