/**
 * EXIF Remover – Strip metadata from image.
 */
import { setupDragDrop, formatBytes } from '../utils/helpers.js';

export function initExifRemover(container) {
  container.innerHTML = `
    <h2>Remove EXIF Metadata</h2>
    <p class="subtitle">Strip location, camera data, and all hidden info</p>
    <div class="upload-box" id="dropZoneExif">
      <div class="upload-content">
        <span class="upload-icon">📁</span>
        <p>Drop image here or <span class="browse">browse</span></p>
        <input type="file" id="fileInputExif" accept="image/*" hidden>
      </div>
    </div>
    <div class="controls">
      <div class="control-group">
        <label for="exifFormat">Output Format:</label>
        <select id="exifFormat">
          <option value="image/jpeg">JPEG</option>
          <option value="image/png">PNG</option>
        </select>
      </div>
    </div>
    <button class="btn btn-primary" id="removeExifBtn">Remove EXIF & Download</button>
    <div class="preview-single" id="exifPreview"></div>
  `;

  const dropZone = document.getElementById('dropZoneExif');
  const fileInput = document.getElementById('fileInputExif');
  const formatSelect = document.getElementById('exifFormat');
  const removeBtn = document.getElementById('removeExifBtn');
  const preview = document.getElementById('exifPreview');
  let originalFile = null;

  setupDragDrop(dropZone, fileInput, (files) => {
    originalFile = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.innerHTML = `<img src="${e.target.result}" alt="preview">`;
    };
    reader.readAsDataURL(originalFile);
  });

  removeBtn.addEventListener('click', () => {
    if (!originalFile) return alert('Upload an image.');
    const img = new Image();
    img.src = URL.createObjectURL(originalFile);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const mime = formatSelect.value;
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cleaned_${originalFile.name.replace(/\.[^/.]+$/, '')}.${mime.split('/')[1]}`;
        a.click();
        URL.revokeObjectURL(url);
      }, mime);
    };
  });
}