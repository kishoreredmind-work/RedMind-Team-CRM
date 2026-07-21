<?php
// Team Members routes (aliases for users)

if ($method === 'GET' && !$id) {
    // Get all members
    $result = $conn->query("SELECT id, name, email, role, status FROM users ORDER BY name ASC");
    $members = [];
    
    while ($row = $result->fetch_assoc()) {
        $members[] = $row;
    }
    
    respond(true, $members);
}

elseif ($method === 'GET' && $id) {
    // Get single member
    $stmt = $conn->prepare("SELECT id, name, email, role, status, avatar_url FROM users WHERE id = ?");
    $stmt->bind_param("s", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        respond(false, null, 'Member not found');
    }
    
    respond(true, $result->fetch_assoc());
}

elseif ($method === 'POST') {
    // Create member (similar to signup)
    $name = $input['name'] ?? null;
    $email = $input['email'] ?? null;
    $password = $input['password'] ?? null;
    $role = $input['role'] ?? 'TEAM_MEMBER';
    $status = $input['status'] ?? 'PENDING';
    
    if (!$name || !$email || !$password) {
        respond(false, null, 'Missing required fields');
    }
    
    // Check if user exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        respond(false, null, 'Email already exists');
    }
    
    $memberId = generateUUID();
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    
    $stmt = $conn->prepare("INSERT INTO users (id, name, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssss", $memberId, $name, $email, $hashedPassword, $role, $status);
    
    if ($stmt->execute()) {
        respond(true, ['id' => $memberId, 'name' => $name, 'email' => $email], null, 'Member created successfully');
    } else {
        respond(false, null, 'Failed to create member');
    }
}

elseif ($method === 'PUT' && $id) {
    // Update member
    $name = $input['name'] ?? null;
    $role = $input['role'] ?? null;
    $status = $input['status'] ?? null;
    
    $stmt = $conn->prepare("UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role), status = COALESCE(?, status) WHERE id = ?");
    $stmt->bind_param("ssss", $name, $role, $status, $id);
    
    if ($stmt->execute()) {
        respond(true, null, null, 'Member updated successfully');
    } else {
        respond(false, null, 'Failed to update member');
    }
}

elseif ($method === 'DELETE' && $id) {
    // Delete member
    $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
    $stmt->bind_param("s", $id);
    
    if ($stmt->execute()) {
        respond(true, null, null, 'Member deleted successfully');
    } else {
        respond(false, null, 'Failed to delete member');
    }
}

else {
    respond(false, null, 'Invalid members endpoint');
}
?>
