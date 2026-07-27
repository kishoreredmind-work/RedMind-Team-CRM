<?php
require_once __DIR__ . '/config.php';

$leadId = 'c436cd91-b987-4686-9370-ee0df21ee50c'; // Kishorekumar Lead ID
$jayakumarId = 'e86965fd-9b2d-47fc-9357-b31d5a79e039'; // Jayakumar Team Member ID

$tasksToImport = [
    [
        'title' => 'woocomers frountend manager plugin develop',
        'project_name' => 'Woocommerce Frontend Manager',
        'status' => 'Doing'
    ],
    [
        'title' => 'SAD textiles business card making',
        'project_name' => 'SAD Textiles',
        'status' => 'Doing'
    ],
    [
        'title' => 'Elevate A Space LOGO recreation',
        'project_name' => 'Elevate A Space',
        'status' => 'Doing'
    ],
    [
        'title' => 'KT form kalaivani for thalia-da website, century 360 and Startlines',
        'project_name' => 'Thalia-da',
        'status' => 'Doing'
    ],
    [
        'title' => 'LV Industry Package 7 flavors designs completed shared to client review',
        'project_name' => 'LV Industry',
        'status' => 'Doing'
    ]
];

$insertedTasks = 0;

foreach ($tasksToImport as $taskData) {
    $pName = $taskData['project_name'];
    $title = $taskData['title'];
    $status = $taskData['status'];
    
    // 1. Check or create Project
    $pStmt = $conn->prepare("SELECT id FROM projects WHERE name = ?");
    $pStmt->bind_param("s", $pName);
    $pStmt->execute();
    $pRes = $pStmt->get_result()->fetch_assoc();
    
    if ($pRes) {
        $projectId = $pRes['id'];
        
        // Ensure Jayakumar is assigned to the project members
        $checkMem = $conn->prepare("SELECT 1 FROM project_members WHERE project_id = ? AND member_id = ?");
        $checkMem->bind_param("ss", $projectId, $jayakumarId);
        $checkMem->execute();
        if ($checkMem->get_result()->num_rows === 0) {
            $insMember = $conn->prepare("INSERT INTO project_members (id, project_id, member_id) VALUES (?, ?, ?)");
            $memId = generateUUID();
            $insMember->bind_param("sss", $memId, $projectId, $jayakumarId);
            $insMember->execute();
        }
    } else {
        // Create Client
        $clientId = generateUUID();
        $clientName = $pName;
        $company = $pName;
        $notes = "Auto-created client during Jayakumar task migration.";
        $insClient = $conn->prepare("INSERT INTO clients (id, name, company, notes, created_by) VALUES (?, ?, ?, ?, ?)");
        $insClient->bind_param("sssss", $clientId, $clientName, $company, $notes, $leadId);
        $insClient->execute();
        
        // Create Project
        $projectId = generateUUID();
        $desc = "Project stream for tasks relating to: " . $pName;
        $startDate = date('Y-m-d');
        $deadline = date('Y-m-d', strtotime('+30 days'));
        $workingDays = 22;
        $pStatus = 'In Progress';
        
        $insProject = $conn->prepare("INSERT INTO projects (id, name, description, client_id, status, start_date, end_date, working_days, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $insProject->bind_param("sssssssss", $projectId, $pName, $desc, $clientId, $pStatus, $startDate, $deadline, $workingDays, $leadId);
        $insProject->execute();
        
        // Map Lead to Project
        $insMember = $conn->prepare("INSERT INTO project_members (id, project_id, member_id) VALUES (?, ?, ?)");
        $memId = generateUUID();
        $insMember->bind_param("sss", $memId, $projectId, $leadId);
        $insMember->execute();

        // Map Jayakumar to Project
        $insMember2 = $conn->prepare("INSERT INTO project_members (id, project_id, member_id) VALUES (?, ?, ?)");
        $memId2 = generateUUID();
        $insMember2->bind_param("sss", $memId2, $projectId, $jayakumarId);
        $insMember2->execute();
    }
    
    // 2. Insert Task
    $taskId = generateUUID();
    $priority = 'Medium';
    $notes = 'Initial task data load for team member.';
    
    $insTask = $conn->prepare("INSERT INTO tasks (id, title, project_id, assigned_to, status, priority, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $insTask->bind_param("sssssss", $taskId, $title, $projectId, $jayakumarId, $status, $priority, $notes);
    $insTask->execute();
    
    $insertedTasks++;
}

echo "SUCCESS: Migrated {$insertedTasks} tasks successfully into Jayakumar's work queue!";
