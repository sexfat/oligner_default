<?php
include 'db_connection.php'; // 確保已經包含資料庫連接

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 獲取表單資料，與前端邏輯對應
    $task_name = $_POST['task_name'] ?? '';
    $condition = $_POST['condition'] ?? '';
    $name = $_POST['name'] ?? '';
    $rocYear = $_POST['rocYear'] ?? '';
    $age = $_POST['age'] ?? 0;
    $phone = $_POST['phone'] ?? '';
    $city = $_POST['city'] ?? '';
    $region = $_POST['region'] ?? '';
    $email = $_POST['email'] ?? '';

    // 確保上層的 upload 資料夾存在
    $uploadDir = '../upload/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $maxFileSize = 2 * 1024 * 1024; // 設定最大檔案大小為 2MB
    $photos = [];

    // 處理照片資料並儲存到伺服器，將路徑存入陣列
    for ($i = 1; $i <= 5; $i++) {
        $photoKey = "photo$i";
        if (isset($_FILES[$photoKey]) && $_FILES[$photoKey]['error'] === UPLOAD_ERR_OK) {
            // 確認檔案大小是否超過限制
            if ($_FILES[$photoKey]['size'] > $maxFileSize) {
                echo "照片過大：第 {$i} 張 (超過 2MB 限制)";
                exit;
            }

            // 取得檔案暫存路徑
            $tmpName = $_FILES[$photoKey]['tmp_name'];

            // 壓縮圖像並轉換為 JPG 格式
            $img = imagecreatefromstring(file_get_contents($tmpName));
            if ($img === false) {
                echo "無法讀取圖像：第 {$i} 張";
                exit;
            }

            $newFileName = $uploadDir . uniqid("photo{$i}_") . '.jpg';
            imagejpeg($img, $newFileName, 95); // 儲存為 JPG 格式並壓縮品質設為 95%
            imagedestroy($img); // 釋放圖像資源

            // 確認圖片已成功儲存
            if (file_exists($newFileName)) {
                $photos[] = $newFileName;
            } else {
                echo "照片儲存失敗：第 {$i} 張";
                exit;
            }
        }
    }

    // 將照片路徑轉換為 JSON 字串以便存入資料庫
    $photos_json = json_encode($photos);

    // 插入資料到資料庫，確保參數與前端一致
    $sql = "INSERT INTO user_info (task_name, `condition`, name, rocYear, age, phone, city, region, email, photos) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        echo "資料庫錯誤：" . $conn->error;
        exit;
    }

    $stmt->bind_param('ssssisssss', $task_name, $condition, $name, $rocYear, $age, $phone, $city, $region, $email, $photos_json);

    if ($stmt->execute()) {
        echo "資料提交成功";
    } else {
        echo "提交失敗：" . $stmt->error;
    }

    $stmt->close();
    $conn->close();
}
?>
