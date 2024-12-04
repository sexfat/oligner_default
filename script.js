// 選取所有的圖片容器
const imageContainers = document.querySelectorAll('.image-container');

let selectedPage = null; // 儲存選擇的任務頁面

// 點擊圖片時儲存所選頁面並跳轉
imageContainers.forEach(container => {
    container.addEventListener('click', () => {
        imageContainers.forEach(c => c.classList.remove('selected'));
        container.classList.add('selected');
        selectedPage = container.dataset.option;

        // 立即跳轉到選定的任務頁面
        if (selectedPage) {
            window.location.href = selectedPage;
        }
    });
});
