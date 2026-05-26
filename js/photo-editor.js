// photo-editor.js – works with the latest photo-editor.html
let originalImage = null;
let canvas = null;
let ctx = null;
let history = [];

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadSection = document.getElementById('uploadSection');
    const editorSection = document.getElementById('editorSection');

    function handleFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                initCanvas(img);
                uploadSection.style.display = 'none';
                editorSection.style.display = 'block';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Upload triggers
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) handleFile(e.target.files[0]);
    });
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ec4899';
    });
    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#94a3b8';
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#94a3b8';
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });

    // Sliders
    document.getElementById('brightness').addEventListener('input', livePreview);
    document.getElementById('contrast').addEventListener('input', livePreview);
    document.getElementById('saturation').addEventListener('input', livePreview);

    // Buttons
    document.getElementById('rotateLeft').addEventListener('click', () => rotateImage(-90));
    document.getElementById('rotateRight').addEventListener('click', () => rotateImage(90));
    document.getElementById('flipH').addEventListener('click', () => flipImage('h'));
    document.getElementById('flipV').addEventListener('click', () => flipImage('v'));
    document.getElementById('grayscaleBtn').addEventListener('click', () => applyFilter('grayscale(100%)'));
    document.getElementById('sepiaBtn').addEventListener('click', () => applyFilter('sepia(100%)'));
    document.getElementById('blurBtn').addEventListener('click', () => applyFilter('blur(4px)'));
    document.getElementById('zoomInBtn').addEventListener('click', () => resizeCanvas(1.2));
    document.getElementById('zoomOutBtn').addEventListener('click', () => resizeCanvas(0.8));
    document.getElementById('resetBtn').addEventListener('click', resetEditor);
    document.getElementById('downloadBtn').addEventListener('click', downloadEditedImage);
});

function initCanvas(img) {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    saveHistory();
}

function saveHistory() {
    history.push(canvas.toDataURL());
    if (history.length > 10) history.shift();
}

function livePreview() {
    if (!ctx || !originalImage) return;
    const brightness = document.getElementById('brightness').value;
    const contrast = document.getElementById('contrast').value;
    const saturation = document.getElementById('saturation').value;
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
}

function applyFilter(filter) {
    if (!ctx || !originalImage) return;
    ctx.filter = filter === 'none' ? 'none' : filter;
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    saveHistory();
}

function rotateImage(deg) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.height;
    tempCanvas.height = canvas.width;
    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
    tempCtx.rotate(deg * Math.PI / 180);
    tempCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    canvas.width = tempCanvas.width;
    canvas.height = tempCanvas.height;
    ctx.drawImage(tempCanvas, 0, 0);
    saveHistory();
}

function flipImage(direction) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    if (direction === 'h') {
        tempCtx.scale(-1, 1);
        tempCtx.drawImage(canvas, -canvas.width, 0);
    } else {
        tempCtx.scale(1, -1);
        tempCtx.drawImage(canvas, 0, -canvas.height);
    }
    ctx.drawImage(tempCanvas, 0, 0);
    saveHistory();
}

function resizeCanvas(scale) {
    const w = Math.floor(canvas.width * scale);
    const h = Math.floor(canvas.height * scale);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0, w, h);
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(tempCanvas, 0, 0);
    saveHistory();
}

function resetEditor() {
    if (originalImage) {
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;
        ctx.drawImage(originalImage, 0, 0);
        saveHistory();
    }
}

function downloadEditedImage() {
    const link = document.createElement('a');
    link.download = 'edited-photo.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}