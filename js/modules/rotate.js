/**
 * Rotate & Flip Module – Rotate 90°, 180°, flip horizontal/vertical.
 */
import { setupDragDrop } from '../utils/helpers.js';

export function initRotate(container) {
  container.innerHTML = `
    <h2>Rotate & Flip Image</h2>
    <div class="upload-box" id="dropZoneRotate">
      <div class="upload-content">
        <span class="upload-icon">📁</span>
        <p>Drop image here or <span class="browse">browse</span></p>
        <input type="file" id="fileInputRotate" accept="image/*" hidden>
      </div>
    </div>
    <div class="controls">
      <button class="btn" id="rotateLeft">↺ 90° Left</button>
      <button class="btn" id="rotateRight">↻ 90° Right</button>
      <button class="btn" id="flipH">⇔ Flip Horizontal</button>
      <button class="btn" id="flipV">⇕ Flip Vertical</button>
    </div>
    <button class="btn btn-primary" id="downloadRotated">Download</button>
    <div class="preview-single" id="rotatePreview"></div>
  `;

  const dropZone = document.getElementById('dropZoneRotate');
  const fileInput = document.getElementById('fileInputRotate');
  const preview = document.getElementById('rotatePreview');
  let currentImage = null;

  setupDragDrop(dropZone, fileInput, (files) => {
    const file = files[0];
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      currentImage = new Image();
      currentImage.onload = () => preview.innerHTML = `<img src="${currentImage.src}" alt="rotate preview">`;
      currentImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  function transformImage(angle, flipX = 1, flipY = 1) {
    if (!currentImage) return alert('Upload an image.');
    const canvas = document.createElement('canvas');
    const isVertical = (angle === 90 || angle === 270);
    canvas.width = isVertical ? currentImage.height : currentImage.width;
    canvas.height = isVertical ? currentImage.width : currentImage.height;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angle * Math.PI / 180);
    ctx.scale(flipX, flipY);
    ctx.drawImage(currentImage, -currentImage.width / 2, -currentImage.height / 2);
    preview.innerHTML = '';
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      preview.innerHTML = `<img src="${url}" alt="rotated">`;
      document.getElementById('downloadRotated').onclick = () => {
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rotated_image.png';
        a.click();
      };
    });
  }

  document.getElementById('rotateLeft').addEventListener('click', () => transformImage(-90));
  document.getElementById('rotateRight').addEventListener('click', () => transformImage(90));
  document.getElementById('flipH').addEventListener('click', () => transformImage(0, -1, 1));
  document.getElementById('flipV').addEventListener('click', () => transformImage(0, 1, -1));
}