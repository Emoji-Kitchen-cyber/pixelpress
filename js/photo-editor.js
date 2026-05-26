// photo-editor.js – Advanced Photo Editor
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
    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) handleFile(e.target.files[0]);
    });

    // Dragover events
    uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.style.borderColor = '#ec4899'; });
    uploadZone.addEventListener('dragleave', () => { uploadZone.style.borderColor = '#94a3b8'; });
    uploadZone.addEventListener('drop', e => {
        e.preventDefault();
        uploadZone.style.borderColor = '#94a3b8';
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });

    // Slider live preview
    document.getElementById('brightness').addEventListener('input', livePreview);
    document.getElementById('contrast').addEventListener('input', livePreview);
    document.getElementById('saturation').addEventListener('input', livePreview);

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilter(btn.dataset.filter);
        });
    });

    // Display slider values
    document.getElementById('brightness').addEventListener('input', e => document.getElementById('brightnessVal').textContent = e.target.value + '%');
    document.getElementById('contrast').addEventListener('input', e => document.getElementById('contrastVal').textContent = e.target.value + '%');
    document.getElementById('saturation').addEventListener('input', e => document.getElementById('saturationVal').textContent = e.target.value + '%');
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
    const brightness = document.getElementById('brightness').value;
    const contrast = document.getElementById('contrast').value;
    const saturation = document.getElementById('saturation').value;
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
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
    ctx.fillText(text, 50, 80);
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