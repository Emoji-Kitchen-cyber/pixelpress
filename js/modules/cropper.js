/**
 * Cropper Module – Interactive image cropping with drag & resize.
 */
import { setupDragDrop } from '../utils/helpers.js';

export function initCropper(container) {
  container.innerHTML = `
    <h2>Crop Image</h2>
    <p class="subtitle">Drag to select area, then crop & download</p>
    <div class="upload-box" id="dropZoneCrop">
      <div class="upload-content">
        <span class="upload-icon">📁</span>
        <p>Drop image here or <span class="browse">browse</span></p>
        <input type="file" id="fileInputCrop" accept="image/*" hidden>
      </div>
    </div>
    <div class="crop-container" id="cropContainer">
      <canvas id="cropCanvas"></canvas>
      <div id="cropBox" class="crop-box" style="display:none;"></div>
    </div>
    <div class="crop-controls">
      <button class="btn btn-primary" id="cropBtn">Crop & Download</button>
    </div>
  `;

  const dropZone = document.getElementById('dropZoneCrop');
  const fileInput = document.getElementById('fileInputCrop');
  const canvas = document.getElementById('cropCanvas');
  const cropBox = document.getElementById('cropBox');
  const containerDiv = document.getElementById('cropContainer');
  const cropBtn = document.getElementById('cropBtn');
  let cropImage = null;
  let isDragging = false;
  let isMoving = false;
  let startX, startY;
  let moveStartX, moveStartY;
  let cropLeft = 10, cropTop = 10, cropWidth = 200, cropHeight = 200;

  function updateCropBox() {
    cropBox.style.left = cropLeft + 'px';
    cropBox.style.top = cropTop + 'px';
    cropBox.style.width = cropWidth + 'px';
    cropBox.style.height = cropHeight + 'px';
    cropBox.style.display = 'block';
  }

  setupDragDrop(dropZone, fileInput, (files) => {
    if (!files.length) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return alert('Image only.');
    const reader = new FileReader();
    reader.onload = (e) => {
      cropImage = new Image();
      cropImage.onload = () => {
        canvas.width = cropImage.width;
        canvas.height = cropImage.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(cropImage, 0, 0);
        cropLeft = 10;
        cropTop = 10;
        cropWidth = Math.min(300, cropImage.width - 20);
        cropHeight = Math.min(300, cropImage.height - 20);
        updateCropBox();
      };
      cropImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Mouse events for drawing new crop area on canvas
  canvas.addEventListener('mousedown', (e) => {
    if (e.target === cropBox) return; // ignore if clicked on box itself
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    isDragging = true;
    document.addEventListener('mousemove', onDraw);
    document.addEventListener('mouseup', onDrawEnd);
  });

  function onDraw(e) {
    if (!isDragging || !cropImage) return;
    const rect = canvas.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;
    cropLeft = Math.min(startX, curX);
    cropTop = Math.min(startY, curY);
    cropWidth = Math.abs(curX - startX);
    cropHeight = Math.abs(curY - startY);
    // Clamp
    cropLeft = Math.max(0, cropLeft);
    cropTop = Math.max(0, cropTop);
    if (cropLeft + cropWidth > cropImage.width) cropWidth = cropImage.width - cropLeft;
    if (cropTop + cropHeight > cropImage.height) cropHeight = cropImage.height - cropTop;
    updateCropBox();
  }

  function onDrawEnd() {
    isDragging = false;
    document.removeEventListener('mousemove', onDraw);
    document.removeEventListener('mouseup', onDrawEnd);
  }

  // Crop box moving
  cropBox.addEventListener('mousedown', (e) => {
    isMoving = true;
    moveStartX = e.clientX;
    moveStartY = e.clientY;
    const rect = cropBox.getBoundingClientRect();
    cropLeft = rect.left - containerDiv.getBoundingClientRect().left;
    cropTop = rect.top - containerDiv.getBoundingClientRect().top;
    cropWidth = rect.width;
    cropHeight = rect.height;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onMoveEnd);
  });

  function onMove(e) {
    if (!isMoving) return;
    const dx = e.clientX - moveStartX;
    const dy = e.clientY - moveStartY;
    cropLeft = Math.max(0, Math.min(cropImage.width - cropWidth, cropLeft + dx));
    cropTop = Math.max(0, Math.min(cropImage.height - cropHeight, cropTop + dy));
    updateCropBox();
    moveStartX = e.clientX;
    moveStartY = e.clientY;
  }

  function onMoveEnd() {
    isMoving = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onMoveEnd);
  }

  cropBtn.addEventListener('click', () => {
    if (!cropImage) return alert('Upload an image first.');
    const canvas2 = document.createElement('canvas');
    canvas2.width = cropWidth;
    canvas2.height = cropHeight;
    const ctx = canvas2.getContext('2d');
    ctx.drawImage(cropImage, cropLeft, cropTop, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    canvas2.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cropped_image.png';
      a.click();
      URL.revokeObjectURL(url);
    });
  });
}