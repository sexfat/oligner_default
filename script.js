// 選取所有的圖片容器與按鈕
const imageContainers = document.querySelectorAll('.image-container');
const privacyCheckbox = document.getElementById('privacy-checkbox');
const nextButton = document.getElementById('next-button');

let selectedPage = null; // 儲存選擇的任務頁面

// 點擊圖片時儲存所選頁面
imageContainers.forEach(container => {
    container.addEventListener('click', () => {
        imageContainers.forEach(c => c.classList.remove('selected'));
        container.classList.add('selected');
        selectedPage = container.dataset.option;
        checkIfCanProceed();
    });
});

// 檢查隱私條款勾選狀態
privacyCheckbox.addEventListener('change', checkIfCanProceed);

// 啟用或停用按鈕的條件檢查
function checkIfCanProceed() {
    if (selectedPage && privacyCheckbox.checked) {
        nextButton.disabled = false;
        nextButton.classList.add('enabled');
    } else {
        nextButton.disabled = true;
        nextButton.classList.remove('enabled');
    }
}

// 點擊「下一步」按鈕後跳轉
nextButton.addEventListener('click', () => {
    if (selectedPage) {
        window.location.href = selectedPage;
    }
});




