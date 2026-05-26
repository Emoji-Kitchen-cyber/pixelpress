import { setupDragDrop } from '../utils/helpers.js';

export function initCropper(container) {
  container.innerHTML = `
    <h2>Crop Image</h2><p class="subtitle">Drag to select area, then crop & download</p>
    <div class="upload-box" id="dropZoneCrop"><div class="upload-content"><span class="upload-icon">📁</span><p>Drop image here or <span class="browse">browse</span></p><input type="file" id="fileInputCrop" accept="image/*" hidden></div></div>
    <div class="crop-container" id="cropContainer"><canvas id="cropCanvas"></canvas><div id="cropBox" class="crop-box" style="display:none;"></div></div>
    <button class="btn btn-primary" id="cropBtn">Crop & Download</button>
  `;
  const dropZone = container.querySelector('#dropZoneCrop');
  const fileInput = container.querySelector('#fileInputCrop');
  const canvas = container.querySelector('#cropCanvas');
  const cropBox = container.querySelector('#cropBox');
  const cropContainer = container.querySelector('#cropContainer');
  const cropBtn = container.querySelector('#cropBtn');
  let cropImage = null, isDragging = false, isMoving = false;
  let startX, startY, moveStartX, moveStartY;
  let cropLeft = 10, cropTop = 10, cropWidth = 200, cropHeight = 200;

  function updateCropBox() { cropBox.style.left = cropLeft + 'px'; cropBox.style.top = cropTop + 'px'; cropBox.style.width = cropWidth + 'px'; cropBox.style.height = cropHeight + 'px'; cropBox.style.display = 'block'; }

  setupDragDrop(dropZone, fileInput, (files) => {
    if (!files.length) return; const file = files[0];
    if (!file.type.startsWith('image/')) return alert('Image only.');
    const reader = new FileReader();
    reader.onload = (e) => { cropImage = new Image(); cropImage.onload = () => { canvas.width = cropImage.width; canvas.height = cropImage.height; canvas.getContext('2d').drawImage(cropImage, 0, 0); cropLeft = 10; cropTop = 10; cropWidth = Math.min(300, cropImage.width - 20); cropHeight = Math.min(300, cropImage.height - 20); updateCropBox(); }; cropImage.src = e.target.result; };
    reader.readAsDataURL(file);
  });

  canvas.addEventListener('mousedown', (e) => { if (e.target === cropBox) return; const rect = canvas.getBoundingClientRect(); startX = e.clientX - rect.left; startY = e.clientY - rect.top; isDragging = true; });
  window.addEventListener('mousemove', (e) => { if (!isDragging || !cropImage) return; const rect = canvas.getBoundingClientRect(); const curX = e.clientX - rect.left; const curY = e.clientY - rect.top; cropLeft = Math.min(startX, curX); cropTop = Math.min(startY, curY); cropWidth = Math.abs(curX - startX); cropHeight = Math.abs(curY - startY); cropLeft = Math.max(0, cropLeft); cropTop = Math.max(0, cropTop); if (cropLeft + cropWidth > cropImage.width) cropWidth = cropImage.width - cropLeft; if (cropTop + cropHeight > cropImage.height) cropHeight = cropImage.height - cropTop; updateCropBox(); });
  window.addEventListener('mouseup', () => { isDragging = false; });

  cropBox.addEventListener('mousedown', (e) => { isMoving = true; moveStartX = e.clientX; moveStartY = e.clientY; const rect = cropBox.getBoundingClientRect(); cropLeft = rect.left - cropContainer.getBoundingClientRect().left; cropTop = rect.top - cropContainer.getBoundingClientRect().top; cropWidth = rect.width; cropHeight = rect.height; });
  window.addEventListener('mousemove', (e) => { if (!isMoving) return; const dx = e.clientX - moveStartX; const dy = e.clientY - moveStartY; cropLeft = Math.max(0, Math.min(cropImage.width - cropWidth, cropLeft + dx)); cropTop = Math.max(0, Math.min(cropImage.height - cropHeight, cropTop + dy)); updateCropBox(); moveStartX = e.clientX; moveStartY = e.clientY; });
  window.addEventListener('mouseup', () => { isMoving = false; });

  cropBtn.addEventListener('click', () => { if (!cropImage) return alert('Upload an image first.'); const c2 = document.createElement('canvas'); c2.width = cropWidth; c2.height = cropHeight; c2.getContext('2d').drawImage(cropImage, cropLeft, cropTop, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight); c2.toBlob(blob => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'cropped_image.png'; a.click(); URL.revokeObjectURL(url); }); });
}