<?php
$host = 'localhost';
$dbname = 'user_tasks';
$user = 'root';
$password = 'root';

// 建立資料庫連線
$conn = new mysqli($host, $user, $password, $dbname);

// 檢查連線是否成功
if ($conn->connect_error) {
    die("資料庫連接失敗: " . $conn->connect_error);
}
?>
