import { setupDragDrop, showSpinner, hideSpinner } from '../utils/helpers.js';

export function initUpscale(container) {
  container.innerHTML = `
    <h2>AI Upscale (Simulated)</h2><p class="subtitle">Increase image resolution (2x, 4x)</p>
    <div class="upload-box" id="dropZoneUpscale"><div class="upload-content"><span class="upload-icon">📁</span><p>Drop image here or <span class="browse">browse</span></p><input type="file" id="fileInputUpscale" accept="image/*" hidden></div></div>
    <div class="controls"><div class="control-group"><label for="scaleFactor">Scale Factor:</label><select id="scaleFactor"><option value="2">2x</option><option value="4">4x</option></select></div></div>
    <button class="btn btn-primary" id="upscaleBtn">Upscale & Download</button>
    <div class="preview-single" id="upscalePreview"></div>
  `;
  const dropZone = container.querySelector('#dropZoneUpscale');
  const fileInput = container.querySelector('#fileInputUpscale');
  const scaleSelect = container.querySelector('#scaleFactor');
  const upscaleBtn = container.querySelector('#upscaleBtn');
  const preview = container.querySelector('#upscalePreview');
  let originalImage = null;

  setupDragDrop(dropZone, fileInput, (files) => {
    const file = files[0]; if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader(); reader.onload = (e) => { originalImage = new Image(); originalImage.onload = () => preview.innerHTML = `<img src="${originalImage.src}" alt="preview">`; originalImage.src = e.target.result; };
    reader.readAsDataURL(file);
  });

  upscaleBtn.addEventListener('click', () => {
    if (!originalImage) return alert('Upload an image.');
    const scale = parseInt(scaleSelect.value); showSpinner();
    const canvas = document.createElement('canvas'); canvas.width = originalImage.width * scale; canvas.height = originalImage.height * scale;
    const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = true; ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => { const url = URL.createObjectURL(blob); preview.innerHTML = `<img src="${url}" alt="upscaled">`; const a = document.createElement('a'); a.href = url; a.download = `upscaled_${scale}x.png`; a.click(); URL.revokeObjectURL(url); hideSpinner(); });
  });
}