<?php
// Team Members routes (aliases for users)

$currentUser = getAuthenticatedUser();

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
    requireLead();
    
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
        // Send JSON response to browser immediately, closing connection
        respondAndContinue(true, ['id' => $memberId, 'name' => $name, 'email' => $email], null, 'Member created successfully');
        
        $subject = "Welcome to Redmin Team CRM";
        $body = renderEmailTemplate('welcome_member', [
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'loginUrl' => getEnvVar('VITE_API_URL') ?: 'https://mydomain.com'
        ]);
        sendMailNotification($email, $subject, $body);
    } else {
        respond(false, null, 'Failed to create member');
    }
}

elseif ($method === 'PUT' && $id) {
    requireLead();
    
    $name = $input['name'] ?? null;
    $role = $input['role'] ?? null;
    $status = $input['status'] ?? null;
    
    $uStmt = $conn->prepare("SELECT name, email, status FROM users WHERE id = ?");
    $uStmt->bind_param("s", $id);
    $uStmt->execute();
    $existing = $uStmt->get_result()->fetch_assoc();
    
    if (!$existing) {
        respond(false, null, 'Member not found');
    }
    
    $stmt = $conn->prepare("UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role), status = COALESCE(?, status) WHERE id = ?");
    $stmt->bind_param("ssss", $name, $role, $status, $id);
    
    if ($stmt->execute()) {
        $shouldNotify = ($status === 'APPROVED' && $existing['status'] !== 'APPROVED');
        if ($shouldNotify) {
            createNotification($conn, $id, "Your account has been approved by the Lead.", "/");
            
            respondAndContinue(true, null, null, 'Member updated successfully');
            
            $subject = "Your RedMind CRM Account is Approved";
            $body = renderEmailTemplate('account_approved', [
                'name' => $existing['name'],
                'loginUrl' => getEnvVar('VITE_API_URL') ?: 'https://mydomain.com'
            ]);
            sendMailNotification($existing['email'], $subject, $body);
        } else {
            respond(true, null, null, 'Member updated successfully');
        }
    } else {
        respond(false, null, 'Failed to update member');
    }
}

elseif ($method === 'DELETE' && $id) {
    requireLead();
    
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
