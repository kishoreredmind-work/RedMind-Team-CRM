<?php
require_once __DIR__ . '/config.php';

$jsonFile = "d:/Redmin Team CRM/projects_to_migrate.json";
if (!file_exists($jsonFile)) {
    die("JSON file not found: " . $jsonFile);
}

$raw = file_get_contents($jsonFile);
$projects = json_decode($raw, true);

if (!is_array($projects)) {
    die("Invalid JSON content");
}

$leadId = 'c436cd91-b987-4686-9370-ee0df21ee50c'; // Kishorekumar Lead ID
$insertedClients = 0;
$insertedProjects = 0;

foreach ($projects as $proj) {
    $name = $proj['name'];
    $desc = $proj['description'];
    $status = $proj['status'];
    $website = $proj['website'];
    
    // 1. Check/Insert Client
    $cStmt = $conn->prepare("SELECT id FROM clients WHERE name = ?");
    $cStmt->bind_param("s", $name);
    $cStmt->execute();
    $cRes = $cStmt->get_result()->fetch_assoc();
    
    if ($cRes) {
        $clientId = $cRes['id'];
    } else {
        $clientId = generateUUID();
        $company = $name;
        $notes = "Auto-migrated client from spreadsheet tracker.";
        
        $insClient = $conn->prepare("INSERT INTO clients (id, name, company, notes, created_by) VALUES (?, ?, ?, ?, ?)");
        $insClient->bind_param("sssss", $clientId, $name, $company, $notes, $leadId);
        $insClient->execute();
        $insertedClients++;
    }
    
    // 2. Check/Insert Project
    $pStmt = $conn->prepare("SELECT id FROM projects WHERE name = ? AND description = ? AND client_id = ?");
    $pStmt->bind_param("sss", $name, $desc, $clientId);
    $pStmt->execute();
    if ($pStmt->get_result()->num_rows === 0) {
        $projectId = generateUUID();
        $startDate = date('Y-m-d');
        $deadline = date('Y-m-d', strtotime('+30 days'));
        $workingDays = 22;
        
        // Map links if website is present
        $linksJson = null;
        if (!empty($website)) {
            $linksJson = json_encode(['live' => $website]);
        }
        
        $insProject = $conn->prepare("INSERT INTO projects (id, name, description, client_id, status, start_date, end_date, working_days, links, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $insProject->bind_param("sssssssdss", $projectId, $name, $desc, $clientId, $status, $startDate, $deadline, $workingDays, $linksJson, $leadId);
        $insProject->execute();
        
        // 3. Assign Lead to Project
        $insMember = $conn->prepare("INSERT INTO project_members (id, project_id, member_id) VALUES (?, ?, ?)");
        $memId = generateUUID();
        $insMember->bind_param("sss", $memId, $projectId, $leadId);
        $insMember->execute();
        
        $insertedProjects++;
    }
}

echo "SUCCESS: Migrated {$insertedClients} new clients and {$insertedProjects} new projects successfully!";
