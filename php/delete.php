<?php
session_start();
include 'auth_check.php';  // 驗證是否已登入
include 'db_connection.php';

// 確認是否有選取的資料
if (isset($_POST['delete_ids']) && !empty($_POST['delete_ids'])) {
    $ids = implode(',', array_map('intval', $_POST['delete_ids']));  // 安全地處理 ID
    $sql = "DELETE FROM user_info WHERE id IN ($ids)";
    
    if ($conn->query($sql) === TRUE) {
        echo "<script>alert('資料已成功刪除！'); window.location.href='backend.php';</script>";
    } else {
        echo "錯誤: " . $conn->error;
    }
} else {
    echo "<script>alert('請選擇要刪除的資料！'); window.location.href='backend.php';</script>";
}

$conn->close();
?>
