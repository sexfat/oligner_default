<?php
include 'db_connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $formattedTime = date('md_Hi');
    $zipFilename = "user_photo_{$formattedTime}.zip";

    $zip = new ZipArchive();

    // 檢查 ZIP 檔案是否能成功創建
    if ($zip->open($zipFilename, ZipArchive::CREATE) === TRUE) {
        $sql = "SELECT id, name, phone, photos FROM user_info";
        $result = $conn->query($sql);

        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $userId = $row['id'];
                $userName = $row['name'] ?? '未知姓名';
                $userPhone = $row['phone'] ?? '未知電話';

                $userFolder = "user_{$userId}_{$userName}_{$userPhone}";
                $photos = json_decode($row['photos'], true);

                if (json_last_error() !== JSON_ERROR_NONE) {
                    echo "JSON 解碼錯誤: " . json_last_error_msg();
                    continue;
                }

                if (is_array($photos)) {
                    foreach ($photos as $index => $photoPath) {
                        $fullPhotoPath = __DIR__ . '/' . ltrim($photoPath, '/');
                        if (file_exists($fullPhotoPath)) {
                            $photoName = "{$userFolder}/photo_" . ($index + 1) . ".jpg";
                            $zip->addFile($fullPhotoPath, $photoName);
                        } else {
                            echo "找不到圖片檔案: $fullPhotoPath <br>";
                        }
                    }
                }
            }
        } else {
            echo "查詢資料庫失敗或無結果。";
        }

        $zip->close();

        // 設置下載標頭
        header('Content-Type: application/zip');
        header("Content-Disposition: attachment; filename*=UTF-8''" . rawurlencode($zipFilename));
        header('Content-Length: ' . filesize($zipFilename));
        ob_clean();
        flush();
        readfile($zipFilename);
        unlink($zipFilename);
    } else {
        echo '無法創建 ZIP 檔案。';
    }

    $conn->close();
    exit;
}
?>
