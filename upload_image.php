<?php
// 設置目標資料夾
$target_dir = "banner/";

// 確保目標資料夾存在，如果不存在則創建
if (!is_dir($target_dir)) {
    mkdir($target_dir, 0777, true);
}

// 檢查是否有文件上傳
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['image'])) {
    $image_name = basename($_FILES['image']['name']);
    $target_file = $target_dir . $image_name;

    // 限制允許的文件類型
    $allowed_types = ['jpg', 'jpeg', 'png', 'gif'];
    $image_type = strtolower(pathinfo($target_file, PATHINFO_EXTENSION));

    if (!in_array($image_type, $allowed_types)) {
        echo "僅允許上傳 JPG、JPEG、PNG 或 GIF 格式的圖片。";
        exit;
    }

    // 檢查文件大小（限制為 2MB）
    if ($_FILES['image']['size'] > 2 * 1024 * 1024) {
        echo "圖片文件過大，請上傳小於 2MB 的圖片。";
        exit;
    }

    // 如果檔名已存在，則覆蓋原檔案
    if (file_exists($target_file)) {
        unlink($target_file); // 刪除已存在的檔案
    }

    // 嘗試將文件移動到目標資料夾
    if (move_uploaded_file($_FILES['image']['tmp_name'], $target_file)) {
        echo "圖片上傳成功！<br>";
        echo "圖片路徑：<a href='$target_file' target='_blank'>$target_file</a>";
    } else {
        echo "圖片上傳失敗，請重試。";
    }
} else {
    echo "請選擇圖片上傳。";
}
?>
