<?php
// Simple script to test WAMP MySQL database connection and print tables
$conn = new mysqli('localhost', 'root', '', 'redmin_crm', 3306);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error . "\n");
}
echo "Connected successfully to redmin_crm database!\n";

echo "\n--- users table count ---\n";
$res = $conn->query("SELECT COUNT(*) as count FROM users");
if ($res) {
    $row = $res->fetch_assoc();
    echo "Users count: " . $row['count'] . "\n";
} else {
    echo "Error querying users table: " . $conn->error . "\n";
}

echo "\n--- users list ---\n";
$res = $conn->query("SELECT id, name, email, role, status FROM users");
if ($res) {
    while ($row = $res->fetch_assoc()) {
        print_r($row);
    }
}

echo "\n--- notifications table check ---\n";
$res = $conn->query("SHOW TABLES LIKE 'notifications'");
if ($res && $res->num_rows > 0) {
    echo "notifications table exists!\n";
} else {
    echo "notifications table does NOT exist or query failed: " . $conn->error . "\n";
}
?>
