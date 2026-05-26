let originalImage = null;
let currentCanvas = null;
let ctx = null;
let history = [];

document.addEventListener('DOMContentLoaded', () => {
    const uploadZone = document.getElementById('editorUploadZone');
    const fileInput = document.getElementById('editorFileInput');

    function handleFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                initCanvas(img);
                document.getElementById('upload-step').style.display = 'none';
                document.getElementById('editor-step').style.display = 'block';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    uploadZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => e.target.files[0] && handleFile(e.target.files[0]));
});

function initCanvas(img) {
    currentCanvas = document.getElementById('mainCanvas');
    ctx = currentCanvas.getContext('2d');
    currentCanvas.width = img.width;
    currentCanvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    saveHistory();
}

function saveHistory() {
    history.push(currentCanvas.toDataURL());
    if (history.length > 10) history.shift();
}

function livePreview() {
    if (!ctx || !originalImage) return;
    ctx.filter = `brightness(${document.getElementById('brightness').value}%) 
                  contrast(${document.getElementById('contrast').value}%) 
                  saturate(${document.getElementById('saturation').value}%)`;
    ctx.drawImage(originalImage, 0, 0, currentCanvas.width, currentCanvas.height);
}

function applyFilter(type) {
    ctx.filter = type === 'none' ? 'none' : type;
    ctx.drawImage(originalImage, 0, 0, currentCanvas.width, currentCanvas.height);
    saveHistory();
}

function rotateImage(deg) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = currentCanvas.height;
    tempCanvas.height = currentCanvas.width;

    tempCtx.translate(tempCanvas.width/2, tempCanvas.height/2);
    tempCtx.rotate(deg * Math.PI / 180);
    tempCtx.drawImage(currentCanvas, -currentCanvas.width/2, -currentCanvas.height/2);

    currentCanvas.width = tempCanvas.width;
    currentCanvas.height = tempCanvas.height;
    ctx.drawImage(tempCanvas, 0, 0);
    saveHistory();
}

function flipImage(direction) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = currentCanvas.width;
    tempCanvas.height = currentCanvas.height;

    if (direction === 'h') {
        tempCtx.scale(-1, 1);
        tempCtx.drawImage(currentCanvas, -currentCanvas.width, 0);
    } else {
        tempCtx.scale(1, -1);
        tempCtx.drawImage(currentCanvas, 0, -currentCanvas.height);
    }

    ctx.drawImage(tempCanvas, 0, 0);
    saveHistory();
}

function applyCrop(percent) {
    const newW = Math.floor(currentCanvas.width * percent);
    const newH = Math.floor(currentCanvas.height * percent);
    const x = (currentCanvas.width - newW) / 2;
    const y = (currentCanvas.height - newH) / 2;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = newW;
    tempCanvas.height = newH;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(currentCanvas, x, y, newW, newH, 0, 0, newW, newH);

    currentCanvas.width = newW;
    currentCanvas.height = newH;
    ctx.drawImage(tempCanvas, 0, 0);
    saveHistory();
}

function addText() {
    const text = document.getElementById('textInput').value;
    if (!text) return;

    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = document.getElementById('textColor').value;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 5;
    ctx.fillText(text, currentCanvas.width/2 - 100, currentCanvas.height/2);
    saveHistory();
}

function resetEditor() {
    if (originalImage) initCanvas(originalImage);
}

function downloadEditedImage() {
    const link = document.createElement('a');
    link.download = 'edited-photo.png';
    link.href = currentCanvas.toDataURL('image/png');
    link.click();
}