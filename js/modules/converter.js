import { setupDragDrop, formatBytes, showSpinner, hideSpinner } from '../utils/helpers.js';

export function initConverter(container, fileQueue) {
  container.innerHTML = `
    <h2>Convert Format</h2><p class="subtitle">Change image format instantly</p>
    <div class="upload-box" id="dropZoneConvert"><div class="upload-content"><span class="upload-icon">📁</span><p>Drop images here or <span class="browse">browse</span></p><input type="file" id="fileInputConvert" multiple accept="image/*" hidden></div></div>
    <div class="controls"><div class="control-group"><label for="formatSelectConvert">Convert to:</label><select id="formatSelectConvert"><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></div></div>
    <button class="btn btn-primary compress-all" id="convertBtn">Convert All Images</button>
    <div class="preview-grid" id="previewGridConvert"></div>
  `;
  const dropZone = container.querySelector('#dropZoneConvert');
  const fileInput = container.querySelector('#fileInputConvert');
  const formatSelect = container.querySelector('#formatSelectConvert');
  const convertBtn = container.querySelector('#convertBtn');
  const previewGrid = container.querySelector('#previewGridConvert');
  let selectedFiles = [];

  setupDragDrop(dropZone, fileInput, (files) => {
    selectedFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    previewGrid.innerHTML = '';
    selectedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => { const card = document.createElement('div'); card.className = 'preview-card'; card.innerHTML = `<img src="${e.target.result}" alt="${file.name}"><div class="preview-info"><p>${file.name}</p><p>Format: ${file.type}</p></div>`; previewGrid.appendChild(card); };
      reader.readAsDataURL(file);
    });
  });

  convertBtn.addEventListener('click', () => {
    if (!selectedFiles.length) return alert('Add images.');
    const mime = formatSelect.value; showSpinner(); let completed = 0;
    selectedFiles.forEach((file, idx) => {
      const img = new Image(); img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        canvas.toBlob(blob => {
          const url = URL.createObjectURL(blob); const card = previewGrid.children[idx];
          card.querySelector('img').src = url;
          if (!card.querySelector('.download-btn')) { const btn = document.createElement('button'); btn.className = 'download-btn'; btn.textContent = 'Download'; btn.addEventListener('click', () => { const a = document.createElement('a'); a.href = url; a.download = `converted_${file.name.replace(/\.[^/.]+$/, '')}.${mime.split('/')[1]}`; a.click(); }); card.appendChild(btn); }
          completed++; if (completed === selectedFiles.length) hideSpinner();
        }, mime);
      };
    });
  });
}