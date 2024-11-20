<?php
include 'db_connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 取得系統的日期時間：月日 + 時分
    $formattedTime = date('md_Hi'); // 格式為 "月日_24小時制小時分鐘"
    $zipFilename = "user_photo_{$formattedTime}.zip";

    $zip = new ZipArchive();

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

                if (is_array($photos)) {
                    foreach ($photos as $index => $photoPath) {
                        if (file_exists($photoPath)) {
                            $photoName = "{$userFolder}/photo_" . ($index + 1) . ".jpg";
                            $zip->addFile($photoPath, $photoName);
                        }
                    }
                }
            }
        }

        $zip->close();

        // 設置下載標頭，支援中文檔名
        header('Content-Type: application/zip');
        header("Content-Disposition: attachment; filename*=UTF-8''" . rawurlencode($zipFilename));
        header('Content-Length: ' . filesize($zipFilename));
        readfile($zipFilename);

        // 刪除伺服器上的 ZIP 檔案
        unlink($zipFilename);
    } else {
        echo '無法創建 ZIP 檔案。';
    }

    $conn->close();
    exit;
}
?>
