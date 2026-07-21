<?php
// Authentication routes

if ($resource === 'signup' && $method === 'POST') {
    $email = $input['email'] ?? null;
    $password = $input['password'] ?? null;
    $name = $input['name'] ?? null;
    
    if (!$email || !$password || !$name) {
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
    
    // Create user
    $userId = generateUUID();
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    
    $stmt = $conn->prepare("INSERT INTO users (id, email, password, name, role, status) VALUES (?, ?, ?, ?, ?, ?)");
    $role = 'TEAM_MEMBER';
    $status = 'PENDING';
    $stmt->bind_param("ssssss", $userId, $email, $hashedPassword, $name, $role, $status);
    
    if ($stmt->execute()) {
        respond(true, ['id' => $userId, 'email' => $email, 'name' => $name], null, 'User created successfully');
    } else {
        respond(false, null, 'Failed to create user');
    }
}

elseif ($resource === 'login' && $method === 'POST') {
    $email = $input['email'] ?? null;
    $password = $input['password'] ?? null;
    
    if (!$email || !$password) {
        respond(false, null, 'Missing required fields');
    }
    
    $stmt = $conn->prepare("SELECT id, password, name, role, status FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0 || !password_verify($password, $result->fetch_assoc()['password'])) {
        respond(false, null, 'Invalid credentials');
    }
    
    $user = $result->fetch_assoc();
    respond(true, [
        'id' => $user['id'],
        'email' => $email,
        'name' => $user['name'],
        'role' => $user['role'],
        'status' => $user['status']
    ], null, 'Login successful');
}

elseif ($resource === 'logout' && $method === 'POST') {
    respond(true, null, null, 'Logged out successfully');
}

elseif ($resource === 'profile' && $id) {
    if ($method === 'GET') {
        $stmt = $conn->prepare("SELECT id, email, name, role, status, avatar_url FROM users WHERE id = ?");
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            respond(false, null, 'User not found');
        }
        
        $user = $result->fetch_assoc();
        respond(true, [
            'id' => $user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'role' => $user['role'],
            'status' => $user['status'],
            'avatar' => $user['avatar_url']
        ]);
    }
    
    elseif ($method === 'PUT') {
        $name = $input['name'] ?? null;
        $avatar = $input['avatar'] ?? null;
        
        $stmt = $conn->prepare("UPDATE users SET name = COALESCE(?, name), avatar_url = COALESCE(?, avatar_url) WHERE id = ?");
        $stmt->bind_param("sss", $name, $avatar, $id);
        
        if ($stmt->execute()) {
            respond(true, null, null, 'Profile updated successfully');
        } else {
            respond(false, null, 'Failed to update profile');
        }
    }
}

else {
    respond(false, null, 'Invalid auth endpoint');
}
?>
