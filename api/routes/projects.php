<?php
// Projects routes

if ($method === 'GET' && !$id) {
    // Get all projects
    $query = "SELECT p.id, p.name, p.description, p.client_id as clientId, p.status, p.start_date as startDate, p.end_date as deadline, p.working_days as workingDays, p.links, p.created_by FROM projects p ORDER BY p.created_at DESC";
    $result = $conn->query($query);
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
    // Create project
    $name = $input['name'] ?? null;
    $description = $input['description'] ?? null;
    $clientId = $input['clientId'] ?? null;
    $status = $input['status'] ?? 'PENDING';
    $startDate = $input['startDate'] ?? null;
    $deadline = $input['deadline'] ?? null;
    $workingDays = $input['workingDays'] ?? null;
    $links = $input['links'] ?? null;
    $created_by = $input['created_by'] ?? null;
    
    if (!$name) {
        respond(false, null, 'Project name is required');
    }
    
    $projectId = generateUUID();
    $linksJson = json_encode($links ?? []);
    
    $stmt = $conn->prepare("INSERT INTO projects (id, name, description, client_id, status, start_date, end_date, working_days, links, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssssssss", $projectId, $name, $description, $clientId, $status, $startDate, $deadline, $workingDays, $linksJson, $created_by);
    
    if ($stmt->execute()) {
        respond(true, ['id' => $projectId], null, 'Project created successfully');
    } else {
        respond(false, null, 'Failed to create project');
    }
}

elseif ($method === 'PUT' && $id) {
    // Update project
    $name = $input['name'] ?? null;
    $description = $input['description'] ?? null;
    $clientId = $input['clientId'] ?? null;
    $status = $input['status'] ?? null;
    $startDate = $input['startDate'] ?? null;
    $deadline = $input['deadline'] ?? null;
    $workingDays = $input['workingDays'] ?? null;
    $links = $input['links'] ?? null;
    
    $linksJson = $links ? json_encode($links) : null;
    
    $stmt = $conn->prepare("UPDATE projects SET name = COALESCE(?, name), description = COALESCE(?, description), client_id = COALESCE(?, client_id), status = COALESCE(?, status), start_date = COALESCE(?, start_date), end_date = COALESCE(?, end_date), working_days = COALESCE(?, working_days), links = COALESCE(?, links) WHERE id = ?");
    $stmt->bind_param("sssssssss", $name, $description, $clientId, $status, $startDate, $deadline, $workingDays, $linksJson, $id);
    
    if ($stmt->execute()) {
        respond(true, null, null, 'Project updated successfully');
    } else {
        respond(false, null, 'Failed to update project');
    }
}

elseif ($method === 'DELETE' && $id) {
    // Delete project
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
