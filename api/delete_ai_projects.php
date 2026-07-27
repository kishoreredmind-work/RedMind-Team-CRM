<?php
require_once __DIR__ . '/config.php';

// Find project IDs to delete
$res = $conn->query("SELECT id FROM projects WHERE description LIKE 'AI Project%'");
$toDelete = [];
while ($row = $res->fetch_assoc()) {
    $toDelete[] = $row['id'];
}

if (empty($toDelete)) {
    echo "No AI projects found to delete.";
    exit;
}

$idsStr = "'" . implode("','", $toDelete) . "'";

// Delete from project_members
$conn->query("DELETE FROM project_members WHERE project_id IN ($idsStr)");

// Delete from projects
$conn->query("DELETE FROM projects WHERE id IN ($idsStr)");

echo "SUCCESS: Deleted " . count($toDelete) . " AI projects and their member mappings successfully.";
