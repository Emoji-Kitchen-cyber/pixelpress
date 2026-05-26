/**
 * Resizer Module – Resize an image to exact dimensions with aspect ratio lock.
 */
import { setupDragDrop, showSpinner, hideSpinner } from '../utils/helpers.js';

export function initResizer(container) {
  container.innerHTML = `
    <h2>Resize Image</h2>
    <p class="subtitle">Upload an image and set new dimensions</p>
    <div class="upload-box" id="dropZoneResize">
      <div class="upload-content">
        <span class="upload-icon">📁</span>
        <p>Drop image here or <span class="browse">browse</span></p>
        <input type="file" id="fileInputResize" accept="image/*" hidden>
      </div>
    </div>
    <div class="resize-controls">
      <div class="control-group">
        <label for="resizeWidth">Width (px):</label>
        <input type="number" id="resizeWidth" min="1" value="800">
      </div>
      <div class="control-group">
        <label for="resizeHeight">Height (px):</label>
        <input type="number" id="resizeHeight" min="1" value="600">
      </div>
      <div class="control-group">
        <label><input type="checkbox" id="keepAspect" checked> Lock aspect ratio</label>
      </div>
      <button class="btn btn-primary" id="resizeBtn">Resize & Download</button>
    </div>
    <div class="preview-single" id="resizePreview"></div>
  `;

  const dropZone = document.getElementById('dropZoneResize');
  const fileInput = document.getElementById('fileInputResize');
  const widthInput = document.getElementById('resizeWidth');
  const heightInput = document.getElementById('resizeHeight');
  const keepAspect = document.getElementById('keepAspect');
  const resizeBtn = document.getElementById('resizeBtn');
  const preview = document.getElementById('resizePreview');

  let originalImage = null;
  let originalWidth = 0, originalHeight = 0;

  setupDragDrop(dropZone, fileInput, (files) => {
    if (!files.length) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return alert('Please select an image.');
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        originalImage = img;
        originalWidth = img.width;
        originalHeight = img.height;
        widthInput.value = img.width;
        heightInput.value = img.height;
        preview.innerHTML = `<img src="${img.src}" alt="preview">`;
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  widthInput.addEventListener('input', () => {
    if (keepAspect.checked && originalImage) {
      const ratio = originalWidth / originalHeight;
      heightInput.value = Math.round(widthInput.value / ratio);
    }
  });

  heightInput.addEventListener('input', () => {
    if (keepAspect.checked && originalImage) {
      const ratio = originalWidth / originalHeight;
      widthInput.value = Math.round(heightInput.value * ratio);
    }
  });

  resizeBtn.addEventListener('click', () => {
    if (!originalImage) return alert('Upload an image first.');
    const w = parseInt(widthInput.value) || originalWidth;
    const h = parseInt(heightInput.value) || originalHeight;
    showSpinner();
    // ✅ Fixed: Worker path relative to index.html
    const worker = new Worker('js/utils/imageWorker.js');
    createImageBitmap(originalImage).then(bitmap => {
      worker.postMessage({
        imageBitmap: bitmap,
        width: w,
        height: h,
        quality: 0.92,
        format: 'image/png'
      }, [bitmap]);
    });
    worker.onmessage = (e) => {
      if (e.data.blob) {
        const url = URL.createObjectURL(e.data.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resized_image.png';
        a.click();
        URL.revokeObjectURL(url);
      }
      hideSpinner();
      worker.terminate();
    };
  });
}