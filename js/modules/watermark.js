/**
 * Watermark Module – Add text watermark to image.
 */
import { setupDragDrop } from '../utils/helpers.js';

export function initWatermark(container) {
  container.innerHTML = `
    <h2>Add Watermark</h2>
    <p class="subtitle">Upload an image and add custom text watermark</p>
    <div class="upload-box" id="dropZoneWatermark">
      <div class="upload-content">
        <span class="upload-icon">📁</span>
        <p>Drop image here or <span class="browse">browse</span></p>
        <input type="file" id="fileInputWatermark" accept="image/*" hidden>
      </div>
    </div>
    <div class="controls">
      <div class="control-group">
        <label for="watermarkText">Watermark Text:</label>
        <input type="text" id="watermarkText" value="© PixelPress">
      </div>
      <div class="control-group">
        <label for="fontSize">Font Size:</label>
        <input type="number" id="fontSize" value="40" min="10" max="200">
      </div>
      <div class="control-group">
        <label for="fontColor">Color:</label>
        <input type="color" id="fontColor" value="#ffffff">
      </div>
    </div>
    <button class="btn btn-primary" id="watermarkBtn">Apply Watermark & Download</button>
    <div class="preview-single" id="watermarkPreview"></div>
  `;

  const dropZone = document.getElementById('dropZoneWatermark');
  const fileInput = document.getElementById('fileInputWatermark');
  const textInput = document.getElementById('watermarkText');
  const fontSize = document.getElementById('fontSize');
  const fontColor = document.getElementById('fontColor');
  const applyBtn = document.getElementById('watermarkBtn');
  const preview = document.getElementById('watermarkPreview');
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

  applyBtn.addEventListener('click', () => {
    if (!originalImage) return alert('Upload an image.');
    const canvas = document.createElement('canvas');
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(originalImage, 0, 0);
    // Add watermark
    ctx.font = `${fontSize.value}px Arial`;
    ctx.fillStyle = fontColor.value;
    ctx.globalAlpha = 0.5;
    ctx.textAlign = 'center';
    ctx.fillText(textInput.value, canvas.width / 2, canvas.height - 30);
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'watermarked_image.png';
      a.click();
      URL.revokeObjectURL(url);
    });
  });
}