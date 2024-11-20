<?php
session_start();
include 'db_connection.php';

$username = $_POST['username'];
$password = $_POST['password'];

// 查詢使用者
$sql = "SELECT * FROM admin_users WHERE username = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('s', $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();

    // 使用 password_verify() 驗證加密密碼
    if (password_verify($password, $user['password'])) {
        $_SESSION['logged_in'] = true;
        header('Location: backend.php');  // 登入成功後跳轉
        exit();
    } else {
        echo "密碼錯誤";
    }
} else {
    echo "帳號不存在";
}

$stmt->close();
$conn->close();
?>
