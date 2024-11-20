<?php
include 'db_connection.php'; // 資料庫連接

// 設定檔名，包含當前日期和時間（格式為：mdHi，即月日小時分鐘）
$filename = 'user_info_export_' . date('md_Hi') . '.csv';


// 設定 HTTP 標頭，讓瀏覽器下載 CSV 檔案，並使用動態檔名
header('Content-Type: text/csv; charset=utf-8');
header("Content-Disposition: attachment; filename=\"$filename\"");

// 開啟輸出流
$output = fopen('php://output', 'w');

// 寫入 CSV 標題行
fputcsv($output, ['ID', '任務名稱', '姓名', '出生年月年齡', '電話', '信箱', '狀況', '縣市', '區域別', '備註', '提交時間']);

// 從資料庫中查詢所有資料
$sql = "SELECT * FROM user_info ORDER BY id DESC";
$result = $conn->query($sql);

// 檢查是否有資料
if ($result && $result->num_rows > 0) {
    // 逐行寫入資料
    while ($row = $result->fetch_assoc()) {
        // 格式化 rocYear、month 和 age 為單一欄位
        $birthInfo = "民國 " . ($row['rocYear'] ?? "") . " 年 / " . ($row['month'] ?? "") . " 月 / 年齡：" . ($row['age'] ?? "");

        fputcsv($output, [
            $row['id'],
            $row['task_name'],
            $row['name'],
            $birthInfo,
            $row['phone'],
            $row['email'],
            $row['condition'],
            $row['city'],
            $row['region'],
            $row['remark'],
            $row['created_at']
        ]);
    }
} else {
    // 若無資料，寫入一行訊息
    fputcsv($output, ['無資料']);
}

// 關閉資料庫連接
$conn->close();
exit;
?>
