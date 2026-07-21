<?php
include 'config.php';

echo "Database connection successful!\n";

$res = $conn->query("SELECT * FROM notifications");
if ($res) {
    echo "Query succeeded! Notifications count: " . $res->num_rows . "\n";
} else {
    echo "Query failed: " . $conn->error . "\n";
}
?>
