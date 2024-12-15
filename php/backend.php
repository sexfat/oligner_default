<?php
session_start();
include 'auth_check.php';  // 驗證是否已登入
include 'db_connection.php';  // 資料庫連接

$searchTerm = isset($_GET['search']) ? $_GET['search'] : '';

// 查詢 SQL，根據電話或姓名進行搜尋，並選取所有需要的欄位
$sql = "SELECT * FROM user_info WHERE phone LIKE ? OR name LIKE ? ORDER BY id DESC";
$stmt = $conn->prepare($sql);
$searchPattern = '%' . $searchTerm . '%';
$stmt->bind_param('ss', $searchPattern, $searchPattern);
$stmt->execute();
$result = $stmt->get_result();
?>

<!DOCTYPE html>
<html lang="zh-TW">

<head>
    <meta charset="UTF-8">
    <title>後台資料管理</title>
    <link rel="stylesheet" href="../css/back.css">
    <!-- 添加樣式 -->
    <style>
        /* 模態框樣式 */
        .modal {
            display: none;
            /* 預設隱藏 */
            position: fixed;
            z-index: 999;
            padding-top: 60px;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0, 0, 0, 0.8);
        }

        /* 模態框內容（圖片） */
        .modal-content {
            margin: auto;
            display: block;
            max-width: 90%;
            max-height: 90%;
        }

        /* 圖片標題 */
        #caption {
            margin: auto;
            display: block;
            width: 80%;
            max-width: 700px;
            text-align: center;
            color: #ccc;
            padding: 10px 0;
        }

        /* 動畫效果 */
        .modal-content,
        #caption {
            animation-name: zoom;
            animation-duration: 0.6s;
        }

        @keyframes zoom {
            from {
                transform: scale(0)
            }

            to {
                transform: scale(1)
            }
        }

        /* 關閉按鈕 */
        .close {
            position: absolute;
            top: 30px;
            right: 45px;
            color: #fff;
            font-size: 40px;
            font-weight: bold;
            transition: 0.3s;
            cursor: pointer;
        }

        .close:hover,
        .close:focus {
            color: #bbb;
            text-decoration: none;
        }
    </style>
</head>

<body class="takePhoto">
    <div class="export">
        <form action="export_to_csv.php" method="post">
            <button type="submit" class="export-button">匯出全部資料 (CSV)</button>
        </form>
        <form action="export_photos_zip.php" method="post">
            <button type="submit" class="export-button">匯出全部照片 (ZIP)</button>
        </form>
    </div>
    <div class="back">
        <h1>使用者資料</h1>
        <div class="s-func">
            <div>
                <form method="GET" action="backend.php" class="search-form">
                    <input type="text" name="search" placeholder="輸入姓名或電話" value="<?= htmlspecialchars($searchTerm) ?>">
                    <button type="submit">搜尋</button>
                    <button type="button" onclick="resetSearch()">重置</button>
                </form>
            </div>



        </div>
        <form method="POST" action="delete.php" onsubmit="return confirmDelete();">
            <div class="del"><button type="submit" class="delete-button">批次刪除</button></div>
            <table class="backend">
                <thead>
                    <tr>
                        <th><input type="checkbox" onclick="toggleSelectAll(this)"></th>
                        <th>ID</th>
                        <th>任務名稱</th>
                        <th class="name">姓名</th>
                        <th>年月年齡</th>
                        <th>電話</th>
                        <th>信箱</th>
                        <th>狀況</th>
                        <th>縣市</th>
                        <th>區域</th>
                        <th class="pth">照片</th>
                        <th>提交時間</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if ($result && $result->num_rows > 0): ?>
                        <?php while ($row = $result->fetch_assoc()): ?>
                            <tr>
                                <td><input type="checkbox" name="delete_ids[]" value="<?= htmlspecialchars($row['id']) ?>"></td>
                                <td><?= htmlspecialchars($row['id']) ?></td>
                                <td class="task_name"><?= htmlspecialchars($row['task_name'] ?? '') ?></td>
                                <td><?= htmlspecialchars($row['name'] ?? '') ?></td>
                                <td class="age">
                                    <p><?= "民國 " . ($row['rocYear'] ?? "") . " 年" ?></p>
                                    <p><?= "年齡 " . ($row['age'] ?? "") . " 歲"  ?></p>
                                </td>
                                <td><?= htmlspecialchars($row['phone'] ?? '') ?></td>
                                <td><?= htmlspecialchars($row['email'] ?? '') ?></td>
                                <td><?= htmlspecialchars($row['condition'] ?? '') ?></td>
                                <td><?= htmlspecialchars($row['city'] ?? '') ?></td>
                                <td><?= htmlspecialchars($row['region'] ?? '') ?></td>
                                <td class="img_photo">
                                    <?php
                                    // 處理照片顯示，假設 'photos' 欄位存儲的是 JSON 格式的 Base64 圖片資料
                                    if (!empty($row['photos'])) {
                                        $photos = json_decode($row['photos'], true);
                                        if (is_array($photos)) {
                                            foreach ($photos as $index => $photoData) {
                                                // 給每張圖片添加 class 和 data attribute
                                                echo '<img src="' . htmlspecialchars($photoData) . '" alt="照片' . ($index + 1) . '" class="thumbnail" style="max-width:80px;cursor:pointer;"/><br/>';
                                            }
                                        }
                                    }
                                    ?>
                                </td>
                                <td><?= htmlspecialchars($row['created_at'] ?? '') ?></td>
                            </tr>
                        <?php endwhile; ?>
                    <?php else: ?>
                        <tr>
                            <td colspan="12">目前沒有資料</td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </form>
    </div>

    <!-- 模態框 -->
    <div id="myModal" class="modal">
        <span class="close">&times;</span>
        <img class="modal-content" id="img01">
        <div id="caption"></div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // 判斷每個照片 <td> 是否有 <img>，若無則加入 no_photo class
            document.querySelectorAll('td.img_photo').forEach(td => {
                if (!td.querySelector('img')) {
                    td.classList.add('no_photo');
                    td.textContent = '無照片'; // 顯示 "無照片" 文本
                }
            });

            // 圖片模態框功能
            const modal = document.getElementById('myModal');
            const modalImg = document.getElementById('img01');
            const captionText = document.getElementById('caption');
            const span = document.getElementsByClassName('close')[0];

            // 為所有縮略圖添加點擊事件
            document.querySelectorAll('.thumbnail').forEach(thumbnail => {
                thumbnail.addEventListener('click', function() {
                    modal.style.display = 'block';
                    modalImg.src = this.src;
                    captionText.innerHTML = this.alt;
                });
            });

            // 點擊關閉按鈕時關閉模態框
            span.onclick = function() {
                modal.style.display = 'none';
            };

            // 點擊模態框外部時關閉模態框
            window.onclick = function(event) {
                if (event.target == modal) {
                    modal.style.display = 'none';
                }
            };
        });

        // 修復的重置搜尋功能
        function resetSearch() {
            const url = new URL(window.location.href);
            url.searchParams.delete('search'); // 刪除搜尋參數
            window.location.href = url; // 重新導向到清除後的 URL
        }
        // 批次刪除功能
        function toggleSelectAll(checkbox) {
            const checkboxes = document.querySelectorAll('input[name="delete_ids[]"]');
            checkboxes.forEach(cb => cb.checked = checkbox.checked);
        }

        function confirmDelete() {
            return confirm('確定要刪除選取的資料嗎？');
        }
    </script>
</body>

</html>

<?php
$stmt->close();
$conn->close();
?>