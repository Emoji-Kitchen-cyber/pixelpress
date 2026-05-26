/**
 * AI Upscale Simulation – Simple bicubic upscaling with sharpening.
 */
import { setupDragDrop, showSpinner, hideSpinner } from '../utils/helpers.js';

export function initUpscale(container) {
  container.innerHTML = `
    <h2>AI Upscale (Simulated)</h2>
    <p class="subtitle">Increase image resolution (2x, 4x)</p>
    <div class="upload-box" id="dropZoneUpscale">
      <div class="upload-content">
        <span class="upload-icon">📁</span>
        <p>Drop image here or <span class="browse">browse</span></p>
        <input type="file" id="fileInputUpscale" accept="image/*" hidden>
      </div>
    </div>
    <div class="controls">
      <div class="control-group">
        <label for="scaleFactor">Scale Factor:</label>
        <select id="scaleFactor">
          <option value="2">2x</option>
          <option value="4">4x</option>
        </select>
      </div>
    </div>
    <button class="btn btn-primary" id="upscaleBtn">Upscale & Download</button>
    <div class="preview-single" id="upscalePreview"></div>
  `;

  const dropZone = document.getElementById('dropZoneUpscale');
  const fileInput = document.getElementById('fileInputUpscale');
  const scaleSelect = document.getElementById('scaleFactor');
  const upscaleBtn = document.getElementById('upscaleBtn');
  const preview = document.getElementById('upscalePreview');
  let originalImage = null;

  setupDragDrop(dropZone, fileInput, (files) => {
    const file = files[0];
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      originalImage = new Image();
      originalImage.onload = () => preview.innerHTML = `<img src="${originalImage.src}" alt="preview">`;
      originalImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  upscaleBtn.addEventListener('click', () => {
    if (!originalImage) return alert('Upload an image.');
    const scale = parseInt(scaleSelect.value);
    showSpinner();
    // ✅ Fixed: Worker path relative to index.html
    const worker = new Worker('js/utils/imageWorker.js');
    createImageBitmap(originalImage).then(bitmap => {
      worker.postMessage({
        imageBitmap: bitmap,
        width: originalImage.width * scale,
        height: originalImage.height * scale,
        quality: 0.92,
        format: 'image/png'
      }, [bitmap]);
    });
    worker.onmessage = (e) => {
      if (e.data.blob) {
        const url = URL.createObjectURL(e.data.blob);
        preview.innerHTML = `<img src="${url}" alt="upscaled">`;
        const a = document.createElement('a');
        a.href = url;
        a.download = `upscaled_${scale}x.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
      hideSpinner();
      worker.terminate();
    };
  });
}