<?php
include 'config.php';

// Parse the request
$request_uri = $_SERVER['REQUEST_URI'];
$base_path = '/api/';

// Remove the base path and query string
$path = str_replace($base_path, '', parse_url($request_uri, PHP_URL_PATH));
$parts = array_filter(explode('/', $path));
$parts = array_values($parts);

$method = $_SERVER['REQUEST_METHOD'];
$action = $parts[0] ?? null;
$resource = $parts[1] ?? null;
$id = $parts[2] ?? null;

// Map direct CRUD endpoints (e.g. /members/123) correctly
if ($action !== 'auth' && count($parts) === 2) {
    $id = $parts[1];
    $resource = null;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Route the request
try {
    if ($action === 'auth') {
        require 'routes/auth.php';
    } elseif ($action === 'clients') {
        require 'routes/clients.php';
    } elseif ($action === 'projects') {
        require 'routes/projects.php';
    } elseif ($action === 'tasks') {
        require 'routes/tasks.php';
    } elseif ($action === 'work-logs') {
        require 'routes/work-logs.php';
    } elseif ($action === 'comments') {
        require 'routes/comments.php';
    } elseif ($action === 'members') {
        require 'routes/members.php';
    } elseif ($action === 'notifications') {
        require 'routes/notifications.php';
    } else {
        respond(false, null, 'Endpoint not found', null);
    }
} catch (Exception $e) {
    respond(false, null, $e->getMessage(), null);
}
?>
