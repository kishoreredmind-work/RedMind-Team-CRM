<?php
require_once __DIR__ . '/config.php';

$leadId = 'c436cd91-b987-4686-9370-ee0df21ee50c'; // Kishorekumar Lead ID

$tasksToImport = [
    [
        'title' => 'Redmind Hostinger all wordpress Websites Daily malware scan and removal plugins and wordpress updates',
        'project_name' => 'Redmind Hostinger',
        'status' => 'Done'
    ],
    [
        'title' => 'Deepakam Housing website creation 2nd version changes done shared for client review',
        'project_name' => 'Deepakam Housing',
        'status' => 'Doing'
    ],
    [
        'title' => 'Trim fab website 1st version changes',
        'project_name' => 'Trimfab',
        'status' => 'Doing'
    ],
    [
        'title' => 'Elevate A Space Website Creation changes done shared for client review',
        'project_name' => 'Elevate A Space',
        'status' => 'Doing'
    ],
    [
        'title' => 'LV Industry Package 7 flavors designs completed and handover the designs to Jayakumar for Product images adding',
        'project_name' => 'LV Industry',
        'status' => 'Done'
    ],
    [
        'title' => 'Think It stamp it new TVK website New changes',
        'project_name' => 'Think It stamp it new TVK website',
        'status' => 'Done'
    ],
    [
        'title' => 'VR Tech website 6th Blog upload',
        'project_name' => 'VR Tech website',
        'status' => 'Done'
    ],
    [
        'title' => 'RedMind Ai Robotics Partners pages creation',
        'project_name' => 'RedMind Ai Robotics Partners pages',
        'status' => 'Done'
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
    } else {
        // Create Client
        $clientId = generateUUID();
        $clientName = $pName;
        $company = $pName;
        $notes = "Auto-created client during task migration.";
        $insClient = $conn->prepare("INSERT INTO clients (id, name, company, notes, created_by) VALUES (?, ?, ?, ?, ?)");
        $insClient->bind_param("sssss", $clientId, $clientName, $company, $notes, $leadId);
        $insClient->execute();
        
        // Create Project
        $projectId = generateUUID();
        $desc = "Project stream for tasks relating to: " . $pName;
        $startDate = date('Y-m-d');
        $deadline = date('Y-m-d', strtotime('+30 days'));
        $workingDays = 22;
        $pStatus = ($status === 'Done') ? 'Completed' : 'In Progress';
        
        $insProject = $conn->prepare("INSERT INTO projects (id, name, description, client_id, status, start_date, end_date, working_days, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $insProject->bind_param("sssssssss", $projectId, $pName, $desc, $clientId, $pStatus, $startDate, $deadline, $workingDays, $leadId);
        $insProject->execute();
        
        // Map Lead to Project
        $insMember = $conn->prepare("INSERT INTO project_members (id, project_id, member_id) VALUES (?, ?, ?)");
        $memId = generateUUID();
        $insMember->bind_param("sss", $memId, $projectId, $leadId);
        $insMember->execute();
    }
    
    // 2. Insert Task
    $taskId = generateUUID();
    $priority = 'Medium';
    $notes = 'Initial task data load.';
    
    $insTask = $conn->prepare("INSERT INTO tasks (id, title, project_id, assigned_to, status, priority, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $insTask->bind_param("sssssss", $taskId, $title, $projectId, $leadId, $status, $priority, $notes);
    $insTask->execute();
    
    $insertedTasks++;
}

echo "SUCCESS: Migrated {$insertedTasks} tasks successfully into your My Tasks queue!";
