// DOM 元素取得
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

// 添加 HEIC 轉換庫
const heicScript = document.createElement('script');
heicScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/heic2any/0.0.3/heic2any.min.js';
document.head.appendChild(heicScript);

// 定義步驟資訊
const steps = [
    { step: 'Step.1', title: '正面咬合照', instruction: '請拍攝或上傳您的正面咬合照片。', image: 'images/t1.jpg', mask: 'images/mask1.svg' },
    { step: 'Step.2', title: '上顎齒列照', instruction: '請拍攝或上傳您的上顎齒列照片。', image: 'images/t2.jpg', mask: 'images/mask2.svg' },
    { step: 'Step.3', title: '下顎齒列照', instruction: '請拍攝或上傳您的下顎齒列照片。', image: 'images/t3.jpg', mask: 'images/mask3.svg' },
    { step: 'Step.4', title: '側臉咬合照', instruction: '請拍攝或上傳您的側臉咬合照片。', image: 'images/t4.jpg', mask: 'images/mask4.png' },
    { step: 'Step.5', title: '側臉美觀線', instruction: '請拍攝或上傳您的側臉美觀線。', image: 'images/t5.jpg', mask: 'images/mask5.png' },
];

// 全域變數
let photos = new Array(5).fill(null);
let currentFacingMode = "environment";
let photoConfirmed = new Array(photos.length).fill(false);
let currentPhotoIndex = null;

// HEIC/HEIF 轉換函式
async function convertHeicToJpeg(file) {
    const isHeic = file.type === 'image/heic' || 
                  file.type === 'image/heif' || 
                  file.name.toLowerCase().endsWith('.heic') || 
                  file.name.toLowerCase().endsWith('.heif');

    if (isHeic) {
        try {
            const convertedBlob = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.8
            });
            return new File([convertedBlob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
                type: 'image/jpeg'
            });
        } catch (error) {
            console.error('HEIC conversion error:', error);
            throw new Error('無法轉換 HEIC/HEIF 圖片格式');
        }
    }
    return file;
}


// 啟用攝影機函式
async function startCamera() {
    try {
        const constraints = {
            video: {
                facingMode: currentFacingMode, // "user" 或 "environment"
                width: { ideal: 1280 }, // 設置解析度
                height: { ideal: 720 },
                advanced: [{ zoom: 2 }] // 如果設備支持，增加進階功能
            }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        video.style.transform = currentFacingMode === "user" ? "scaleX(-1)" : "scaleX(1)";
    } catch (error) {
        handleCameraError(error);
    }
}

// 拍攝照片事件處理
captureButton.addEventListener('click', () => {
    const stepIndex = getCurrentStepIndex();
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (currentFacingMode === "user") {
        context.save();
        context.scale(-1, 1);
        context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        context.restore();
    } else {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    canvas.toBlob((blob) => {
        photos[stepIndex] = blob;
        updatePhoto(stepIndex, URL.createObjectURL(blob));
        updateStepDescription();
        if (photos.every(photo => photo !== null)) {
            submitButton.style.display = 'inline-block';
            renewButton.style.display = 'inline-block';
        }
    }, 'image/jpeg', 0.8);
});

// 上傳圖片事件處理
uploadButton.addEventListener('click', () => {
    uploadInput.click();
});

// HEIC/HEIF 轉換函式
async function convertHeicToJpeg(file) {
    const isHeic = file.type === 'image/heic' || 
                  file.type === 'image/heif' || 
                  file.name.toLowerCase().endsWith('.heic') || 
                  file.name.toLowerCase().endsWith('.heif');

    if (isHeic) {
        try {
            const convertedBlob = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.8
            });
            // 確保轉換後的檔案是 jpg 格式
            return new File([convertedBlob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
                type: 'image/jpeg'
            });
        } catch (error) {
            console.error('HEIC conversion error:', error);
            throw new Error('無法轉換 HEIC/HEIF 圖片格式');
        }
    }
    return file;
}

// 修改上傳處理函式
uploadInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    const stepIndex = getCurrentStepIndex();

    if (file) {
        try {
            loadingOverlay.style.display = 'flex';
            
            // 轉換 HEIC/HEIF 檔案
            const processedFile = await convertHeicToJpeg(file);
            
            // 壓縮圖片
            const compressedFile = await compressImage(processedFile);
            
            photos[stepIndex] = compressedFile; // 儲存壓縮後的檔案
            
            const reader = new FileReader();
            reader.onload = (e) => {
                updatePhoto(stepIndex, e.target.result);
                updateStepDescription();
                loadingOverlay.style.display = 'none';
                
                if (photos.every(photo => photo !== null)) {
                    document.querySelector('.taskPhoto').style.display = 'none';
                    document.querySelector('.after').style.display = 'none';
                    document.querySelector('.finish').style.display = 'flex';
                    submitButton.style.display = 'block';
                }
            };
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            console.error('Error processing image:', error);
            alert(error.message || '處理圖片時發生錯誤');
            loadingOverlay.style.display = 'none';
        }
    }
});

// 圖片壓縮函式
async function compressImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // 如果圖片太大，進行等比例縮小
            const MAX_SIZE = 1920;
            if (width > MAX_SIZE || height > MAX_SIZE) {
                if (width > height) {
                    height = Math.round((height * MAX_SIZE) / width);
                    width = MAX_SIZE;
                } else {
                    width = Math.round((width * MAX_SIZE) / height);
                    height = MAX_SIZE;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob((blob) => {
                const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: new Date().getTime()
                });
                resolve(compressedFile);
            }, 'image/jpeg', 0.8); // 調整壓縮品質
        };
        
        img.onerror = () => {
            reject(new Error('圖片處理失敗'));
        };
    });
}

// 設置小圖點擊事件處理函式
function setThumbnailClickHandlers() {
    const photoList = document.querySelectorAll('#photos ul li');
    for (let i = 0; i < photos.length; i++) {
        const thumbnail = document.getElementById(`photo${i + 1}`);
        if (thumbnail) {
            thumbnail.addEventListener('click', () => {
                if (photos[i]) {
                    photoList.forEach(item => item.classList.remove('selected'));
                    thumbnail.classList.add('selected');
                    currentPhotoIndex = i;

                    const largeImage = document.getElementById('large-image');
                    largeImage.src = URL.createObjectURL(photos[i]);
                    largeImage.style.display = 'block';

                    document.querySelector('.finish').style.display = 'none';
                    document.querySelector('.taskPhoto').style.display = 'none';
                    document.querySelector('.after').style.display = 'flex';
                }
            });
        }
    }
}

// 更新照片顯示函式
function updatePhoto(stepIndex, src) {
    const li = document.getElementById(`photo${stepIndex + 1}`);
    li.innerHTML = '';

    const img = document.createElement('img');
    img.src = src;
    li.appendChild(img);

    const deleteButton = document.createElement('div');
    deleteButton.textContent = 'x';
    deleteButton.className = 'delete-button';
    deleteButton.style.display = 'inline-block';
    li.appendChild(deleteButton);

    if (photos.every(photo => photo !== null)) {
        document.querySelector('.taskPhoto').style.display = 'none';
        document.querySelector('.after').style.display = 'none';
        document.querySelector('.finish').style.display = 'flex';
        submitButton.style.display = 'block';
    } else {
        submitButton.style.display = 'none';
    }

    setThumbnailClickHandlers();
}

// 確認照片事件處理
okPhotosButton.addEventListener('click', () => {
    if (currentPhotoIndex !== null) {
        photoConfirmed[currentPhotoIndex] = true;

        const largeImage = document.getElementById('large-image');
        largeImage.style.display = 'none';
        largeImage.src = '';

        document.querySelectorAll('#photos ul li').forEach(item => {
            item.classList.remove('selected');
        });

        if (photos.every(photo => photo !== null)) {
            document.querySelector('.taskPhoto').style.display = 'none';
            document.querySelector('.after').style.display = 'none';
            document.querySelector('.finish').style.display = 'flex';
        } else {
            document.querySelector('.taskPhoto').style.display = 'flex';
            document.querySelector('.after').style.display = 'none';
            document.querySelector('.finish').style.display = 'none';
        }

        currentPhotoIndex = null;
    } else {
        alert('請先選擇一張照片！');
    }
});

// 取得目前步驟索引函式
function getCurrentStepIndex() {
    return photos.findIndex(photo => photo === null);
}

// 更新步驟說明函式
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
        submitButton.style.display = 'none';
    } else {
        document.getElementById('stepOrder').textContent = '完成';
        document.getElementById('step-title').textContent = '所有照片已完成';
        document.getElementById('step-instruction').textContent = '';
        document.getElementById('step-image-src').src = 'images/t6.png';
        maskImage.style.display = 'none';

        if (photos.every(photo => photo !== null)) {
            submitButton.style.display = 'block';
        }
    }
}

// 提交表單事件處理
submitButton.addEventListener('click', async () => {
    const formData = new FormData();
    
    // 添加表單資料
    const taskData = JSON.parse(localStorage.getItem('taskData')) || {};
    formData.append('task_name', taskData.task_name || '');
    formData.append('condition', taskData.condition || '');
    formData.append('name', taskData.name || '');
    formData.append('rocYear', taskData.rocYear || '');
    formData.append('age', taskData.age || '');
    formData.append('phone', taskData.phone || '');
    formData.append('city', taskData.city || '');
    formData.append('region', taskData.region || '');
    formData.append('email', taskData.email || '');

    // 檢查並添加照片
    try {
        loadingOverlay.style.display = 'flex';
        
        for (let i = 0; i < photos.length; i++) {
            if (!photos[i]) {
                alert('請確保所有照片都已完成上傳');
                loadingOverlay.style.display = 'none';
                return;
            }
            
            // 確保所有照片都是 JPEG 格式
            const photo = photos[i];
            const processedPhoto = photo.type.includes('jpeg') ? 
                photo : 
                await convertHeicToJpeg(photo);
                
            // 壓縮照片
            const compressedPhoto = await compressImage(processedPhoto);
            
            formData.append(`photo${i + 1}`, compressedPhoto, `photo${i + 1}.jpg`);
        }

        // 發送請求
        const response = await fetch('php/submit_task.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.text();
        
        if (result.trim() === '資料提交成功') {
            alert('資料提交成功！');
            localStorage.removeItem('taskData');
            window.location.href = 'thank_you.html';
        } else {
            throw new Error(result);
        }
    } catch (error) {
        console.error('提交失敗：', error);
        alert('提交失敗：' + (error.message || '請稍後再試'));
    } finally {
        loadingOverlay.style.display = 'none';
    }
});

// 重新拍攝按鈕事件處理
renewButton.addEventListener('click', () => {
    if (currentPhotoIndex === null) {
        alert('請先選擇一張照片！');
        return;
    }

    photos[currentPhotoIndex] = null;
    photoConfirmed[currentPhotoIndex] = false;
    
    const thumbnail = document.getElementById(`photo${currentPhotoIndex + 1}`);
    if (thumbnail) {
        thumbnail.innerHTML = '';
    }

    const largeImage = document.getElementById('large-image');
    largeImage.src = '';
    largeImage.style.display = 'none';

    updateStepDescription(currentPhotoIndex);
    
    document.querySelector('.taskPhoto').style.display = 'flex';
    document.querySelector('.after').style.display = 'none';
    
    currentPhotoIndex = null;
});

// 切換鏡頭事件處理
switchCameraButton.addEventListener('click', () => {
    currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
    startCamera();
});

// 初始化攝影機
startCamera();