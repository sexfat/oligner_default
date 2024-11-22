<?php
$host = 'localhost';
$dbname = 'somdjnlg_npdata';
$user = 'somdjnlg_npdata';
$password = 'Z&*FVD-.VyKU';

// 建立資料庫連線
$conn = new mysqli($host, $user, $password, $dbname);

// 檢查連線是否成功
if ($conn->connect_error) {
    die("資料庫連接失敗: " . $conn->connect_error);
}
?>

