
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const uploadInput = document.getElementById('upload-image');
const uploadButton = document.getElementById('upload-button');
const captureButton = document.getElementById('capture');
const submitButton = document.getElementById('submit-photos');
const renewButton = document.getElementById('renew-photos');
const switchCameraButton = document.getElementById('switch-camera');
const loadingOverlay = document.getElementById('loading-overlay');
const okPhotosButton = document.getElementById('ok-photos');
const context = canvas.getContext('2d');
let currentRetakeIndex = null;
submitButton.style.display = 'none';

const steps = [
    { step: 'Step.1', title: '正面咬合照', instruction: '請拍攝或上傳您的正面咬合照片。', image: 'images/t1.jpg', mask: 'images/mask1.svg' },
    { step: 'Step.2', title: '上顎齒列照', instruction: '請拍攝或上傳您的上顎齒列照片。', image: 'images/t2.jpg', mask: 'images/mask2.svg' },
    { step: 'Step.3', title: '下顎齒列照', instruction: '請拍攝或上傳您的下顎齒列照片。', image: 'images/t3.jpg', mask: 'images/mask3.svg' },
    { step: 'Step.4', title: '側臉咬合照', instruction: '請拍攝或上傳您的側臉咬合照片。', image: 'images/t4.jpg', mask: 'images/mask4.svg' },
    { step: 'Step.5', title: '側臉美觀線', instruction: '請拍攝或上傳您的側臉美觀線。', image: 'images/t5.jpg', mask: 'images/mask5.svg' },
];

let photos = new Array(5).fill(null);
let currentFacingMode = "environment";
let photoConfirmed = new Array(photos.length).fill(false);


// 啟用攝影機
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: currentFacingMode,
                width: { ideal: 1920 }, // 調整為理想的寬度（例如 1920px）
                height: { ideal: 1080 }, // 調整為理想的高度（例如 1080px）
                advanced: [{ zoom: 2.5 }]
            }
        });
        video.srcObject = stream;

        // 應用鏡像效果
        if (currentFacingMode === "user") {
            video.style.transform = "scaleX(-1)"; // 前置鏡頭翻轉
        } else {
            video.style.transform = "scaleX(1)"; // 恢復後置鏡頭正常顯示
        }
    } catch (error) {
        alert('無法啟用攝影機');
        console.error(error);
    }
}

// 拍攝照片
captureButton.addEventListener('click', () => {
    const stepIndex = getCurrentStepIndex();
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    //context.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (currentFacingMode === "user") {
        context.save();
        context.scale(-1, 1); // 水平翻轉
        context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        context.restore();
    } else {
        context.save();
        context.scale(1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        context.restore();
    }


    canvas.toBlob((blob) => {
        photos[stepIndex] = blob;
        updatePhoto(stepIndex, blob);
        updateStepDescription();
        if (photos.every(photo => photo !== null)) {
            submitButton.style.display = 'inline-block';
            renewButton.style.display = 'inline-block';
        }
    }, 'image/jpeg', 1.0);
});

// 上傳圖片
uploadButton.addEventListener('click', () => {
    uploadInput.click();
});

uploadInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    const stepIndex = getCurrentStepIndex();

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            photos[stepIndex] = file;
            updatePhoto(stepIndex, e.target.result);
            updateStepDescription();
        };
        reader.readAsDataURL(file);
    }
    // 檢查是否所有照片都完成
    if (photos.every(photo => photo !== null)) {
        document.querySelector('.taskPhoto').style.display = 'none';
        document.querySelector('.after').style.display = 'flex';
    }
});


//======================================

// 設置小圖點擊事件
function setThumbnailClickHandlers() {
    for (let i = 0; i < photos.length; i++) {
        const thumbnail = document.getElementById(`photo${i + 1}`);
        if (thumbnail) {
            thumbnail.addEventListener('click', () => {
                if (photos[i]) {
                    currentPhotoIndex = i; // 記錄當前點擊的小圖索引

                    // 顯示大圖區域
                    const largeImage = document.getElementById('large-image');
                    largeImage.src = URL.createObjectURL(photos[i]);
                    largeImage.style.display = 'block';

                    // 隱藏.finish，顯示.after
                    document.querySelector('.finish').style.display = 'none';
                    document.querySelector('.taskPhoto').style.display = 'none';
                    document.querySelector('.after').style.display = 'flex';
                }
            });
        }
    }
}






// 更新小圖後重新綁定點擊事件
function updatePhoto(stepIndex, src) {
    const li = document.getElementById(`photo${stepIndex + 1}`);
    li.innerHTML = '';

    const img = document.createElement('img');
    img.src = src instanceof Blob ? URL.createObjectURL(src) : src;
    li.appendChild(img);

    // 檢查是否所有照片都完成
    if (photos.every(photo => photo !== null)) {
        // 隱藏.taskPhoto 和 .after
        document.querySelector('.taskPhoto').style.display = 'none';
        document.querySelector('.after').style.display = 'none';

        // 顯示.finish
        document.querySelector('.finish').style.display = 'flex'; // 顯示.finish
    }

    // 為每個小圖重新設置點擊事件
    setThumbnailClickHandlers();
}





// ======================================
okPhotosButton.addEventListener('click', () => {
    if (currentPhotoIndex !== null) {
        // 標記該照片為已確認
        photoConfirmed[currentPhotoIndex] = true;

        // 隱藏大圖顯示區域
        const largeImage = document.getElementById('large-image');
        largeImage.src = ''; // 清空大圖
        largeImage.style.display = 'none'; // 隱藏大圖區域

        // 清除當前索引記錄
        currentPhotoIndex = null;

        // 切換狀態：隱藏.after，顯示.finish

        if (photos.every(photo => photo !== null)) {
            document.querySelector('.taskPhoto').style.display = 'none';
            document.querySelector('.after').style.display = 'none';

            // 顯示.finish
            document.querySelector('.finish').style.display = 'flex'; // 顯示.finish
        } else {
            document.querySelector('.taskPhoto').style.display = 'flex';
            document.querySelector('.after').style.display = 'none';

            // 顯示.finish
            document.querySelector('.finish').style.display = 'none'; // 顯示.finish

        }
    } else {

        alert('請先選擇一張照片！');
    }
});




// 下一個功能
function getCurrentStepIndex() {
    return photos.findIndex(photo => photo === null);
}

function updateStepDescription() {
    const nextStepIndex = getCurrentStepIndex();
    const maskImage = document.getElementById('mask-image-src');
    if (nextStepIndex >= 0 && nextStepIndex < steps.length) {
        document.getElementById('stepOrder').textContent = steps[nextStepIndex].step;
        document.getElementById('step-title').textContent = steps[nextStepIndex].title;
        document.getElementById('step-instruction').textContent = steps[nextStepIndex].instruction;
        document.getElementById('step-image-src').src = steps[nextStepIndex].image;
        document.getElementById('mask-image-src').src = steps[nextStepIndex].mask;
        maskImage.style.display = 'block';
    } else {
        document.getElementById('stepOrder').textContent = '完成';
        document.getElementById('step-title').textContent = '所有照片已完成';
        document.getElementById('step-instruction').textContent = '';
        document.getElementById('step-image-src').src = 'images/t6.png';
        maskImage.style.display = 'none'; // 隱藏 mask

        // 切換到完成狀態
        document.querySelector('.taskPhoto').style.display = 'none'; // 隱藏.taskPhoto
        document.querySelector('.after').style.display = 'none'; // 隱藏.after
        document.querySelector('.finish').style.display = 'flex'; // 顯示.finish
    }
}




// 清除所有照片並重置狀態
const renewPhotosButton = document.getElementById('renew-photos');

renewPhotosButton.addEventListener('click', () => {
    if (currentPhotoIndex === null) {
        alert('請先選擇一張照片！');
        return;
    }

    // 清除當前照片資料
    photos[currentPhotoIndex] = null;
    photoConfirmed[currentPhotoIndex] = false;

    // 清空縮圖顯示
    const thumbnail = document.getElementById(`photo${currentPhotoIndex + 1}`);
    if (thumbnail) {
        thumbnail.innerHTML = ''; // 清除縮圖
    }

    // 隱藏大圖顯示區域
    const largeImage = document.getElementById('large-image');
    largeImage.src = ''; // 清空大圖
    largeImage.style.display = 'none'; // 隱藏大圖區域

    // 更新步驟描述到當前照片
    updateStepDescription(currentPhotoIndex);

    // 返回到拍攝狀態
    document.querySelector('.taskPhoto').style.display = 'flex'; // 顯示拍攝相關按鈕
    document.querySelector('.after').style.display = 'none'; // 隱藏「確認/重拍」區域

    // 清除當前索引記錄
    currentPhotoIndex = null;

    // 隱藏提交按鈕（需要重新確認所有照片）
    document.getElementById('submit-photos').style.display = 'none';

    // alert('當前照片已重置，請重新拍攝或上傳！');
});





// 提交所有照片
submitButton.addEventListener('click', () => {
    const formData = new FormData();
    const taskData = JSON.parse(localStorage.getItem('taskData')) || {};

    for (const key in taskData) {
        formData.append(key, taskData[key]);
    }
    photos.forEach((photo, index) => {
        if (photo) {
            formData.append(`photo${index + 1}`, photo, `photo${index + 1}.png`);
        }
    });

    loadingOverlay.style.display = 'flex';

    fetch('php/submit_task.php', {
        method: 'POST',
        body: formData
    })
        .then(response => response.text())
        .then(result => {
            if (result.trim() === '資料提交成功') {
                alert('資料提交成功！');
                localStorage.removeItem('taskData');
                window.location.href = 'thank_you.html';
            } else {
                alert('提交失敗：' + result);
            }
        })
        .catch(error => {
            console.error('提交失敗：', error);
            alert('提交失敗，請稍後再試');
        })
        .finally(() => {
            loadingOverlay.style.display = 'none';
        });
});

// 切換鏡頭
switchCameraButton.addEventListener('click', () => {
    currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
    startCamera();
});

// 初始化
startCamera();
