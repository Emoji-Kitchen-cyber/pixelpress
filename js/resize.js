let originalImageResize = null;
let originalWidth = 0, originalHeight = 0;

document.addEventListener('DOMContentLoaded', () => {
    const uploadZone = document.getElementById('resizeUploadZone');
    const fileInput = document.getElementById('resizeFileInput');

    const uploadStep = document.getElementById('upload-step');
    const settingsStep = document.getElementById('settings-step');
    const processingStep = document.getElementById('processing-step');
    const resultStep = document.getElementById('result-step');

    const widthInput = document.getElementById('widthInput');
    const heightInput = document.getElementById('heightInput');
    const aspectLock = document.getElementById('aspectLock');

    function handleFile(file) {
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => {
                originalImageResize = img;
                originalWidth = img.width;
                originalHeight = img.height;
                widthInput.value = img.width;
                heightInput.value = img.height;
                uploadStep.style.display = 'none';
                settingsStep.style.display = 'block';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Upload Events
    uploadZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => e.target.files[0] && handleFile(e.target.files[0]));

    // Aspect Ratio Lock
    widthInput.addEventListener('input', () => {
        if (aspectLock.checked && originalWidth) {
            heightInput.value = Math.round((widthInput.value / originalWidth) * originalHeight);
        }
    });
    heightInput.addEventListener('input', () => {
        if (aspectLock.checked && originalHeight) {
            widthInput.value = Math.round((heightInput.value / originalHeight) * originalWidth);
        }
    });

    // Resize
    document.getElementById('resizeBtn').addEventListener('click', () => {
        if (!originalImageResize) return;

        settingsStep.style.display = 'none';
        processingStep.style.display = 'block';

        setTimeout(() => {
            const canvas = document.createElement('canvas');
            canvas.width = parseInt(widthInput.value);
            canvas.height = parseInt(heightInput.value);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(originalImageResize, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                document.getElementById('resizedPreview').src = url;

                processingStep.style.display = 'none';
                resultStep.style.display = 'block';

                document.getElementById('downloadResizeBtn').onclick = () => {
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'resized-image.png';
                    a.click();
                };
            }, 'image/png', 0.95);
        }, 100);
    });
});