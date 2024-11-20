<?php
$password = 'admin_mask321';  // 你想要設定的管理員密碼
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);
echo "加密後的密碼: " . $hashedPassword;
?>
