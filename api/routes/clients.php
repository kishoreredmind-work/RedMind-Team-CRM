<?php
// Clients routes

$currentUser = getAuthenticatedUser();

if ($method === 'GET' && !$id) {
    // Get all clients (available to all authenticated users)
    $result = $conn->query("SELECT id, name, company, email, phone, notes, created_by FROM clients ORDER BY created_at DESC");
    $clients = [];
    
    while ($row = $result->fetch_assoc()) {
        $clients[] = $row;
    }
    
    respond(true, $clients);
}

elseif ($method === 'GET' && $id) {
    // Get single client
    $stmt = $conn->prepare("SELECT id, name, company, email, phone, notes, created_by FROM clients WHERE id = ?");
    $stmt->bind_param("s", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        respond(false, null, 'Client not found');
    }
    
    respond(true, $result->fetch_assoc());
}

elseif ($method === 'POST') {
    requireLead();
    
    $name = $input['name'] ?? null;
    $company = $input['company'] ?? null;
    $email = $input['email'] ?? null;
    $phone = $input['phone'] ?? null;
    $notes = $input['notes'] ?? null;
    $created_by = $currentUser['user_id'];
    
    if (!$name) {
        respond(false, null, 'Client name is required');
    }
    
    $clientId = generateUUID();
    
    $stmt = $conn->prepare("INSERT INTO clients (id, name, company, email, phone, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssssss", $clientId, $name, $company, $email, $phone, $notes, $created_by);
    
    if ($stmt->execute()) {
        respond(true, ['id' => $clientId], null, 'Client created successfully');
    } else {
        respond(false, null, 'Failed to create client');
    }
}

elseif ($method === 'PUT' && $id) {
    requireLead();
    
    $name = $input['name'] ?? null;
    $company = $input['company'] ?? null;
    $email = $input['email'] ?? null;
    $phone = $input['phone'] ?? null;
    $notes = $input['notes'] ?? null;
    
    $stmt = $conn->prepare("UPDATE clients SET name = COALESCE(?, name), company = COALESCE(?, company), email = COALESCE(?, email), phone = COALESCE(?, phone), notes = COALESCE(?, notes) WHERE id = ?");
    $stmt->bind_param("ssssss", $name, $company, $email, $phone, $notes, $id);
    
    if ($stmt->execute()) {
        respond(true, null, null, 'Client updated successfully');
    } else {
        respond(false, null, 'Failed to update client');
    }
}

elseif ($method === 'DELETE' && $id) {
    requireLead();
    
    $stmt = $conn->prepare("DELETE FROM clients WHERE id = ?");
    $stmt->bind_param("s", $id);
    
    if ($stmt->execute()) {
        respond(true, null, null, 'Client deleted successfully');
    } else {
        respond(false, null, 'Failed to delete client');
    }
}

else {
    respond(false, null, 'Invalid clients endpoint');
}
?>
