import { setupDragDrop, formatBytes, showSpinner, hideSpinner } from '../utils/helpers.js';

export function initCompressor(container, fileQueue, historyPanel) {
  container.innerHTML = `
    <h2>Image Compressor</h2>
    <p class="subtitle">Drag & drop or click to upload multiple images</p>
    <div class="upload-box" id="dropZoneCompress"><div class="upload-content"><span class="upload-icon">📁</span><p>Drop images here or <span class="browse">browse</span></p><input type="file" id="fileInputCompress" multiple accept="image/*" hidden></div></div>
    <div class="controls"><div class="control-group"><label for="qualitySlider">Quality: <span id="qualityValue">70</span>%</label><input type="range" id="qualitySlider" min="10" max="100" value="70"></div><div class="control-group"><label for="formatSelectCompress">Output Format:</label><select id="formatSelectCompress"><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></div></div>
    <button class="btn btn-primary compress-all" id="compressBtn">Compress All Images</button>
    <div class="preview-grid" id="previewGridCompress"></div>
  `;
  const dropZone = container.querySelector('#dropZoneCompress');
  const fileInput = container.querySelector('#fileInputCompress');
  const qualitySlider = container.querySelector('#qualitySlider');
  const qualityValue = container.querySelector('#qualityValue');
  const formatSelect = container.querySelector('#formatSelectCompress');
  const compressBtn = container.querySelector('#compressBtn');
  const previewGrid = container.querySelector('#previewGridCompress');
  let selectedFiles = [];
  setupDragDrop(dropZone, fileInput, (files) => {
    const images = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!images.length) { alert('Please select valid image files.'); return; }
    selectedFiles = images;
    previewGrid.innerHTML = '';
    selectedFiles.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const card = document.createElement('div'); card.className = 'preview-card';
        card.innerHTML = `<img src="${e.target.result}" alt="${file.name}"><div class="preview-info"><p><strong>${file.name}</strong></p><div class="size-row"><span>Original: ${formatBytes(file.size)}</span><span id="compSize-${idx}">—</span></div></div>`;
        previewGrid.appendChild(card);
      };
      reader.readAsDataURL(file);
    });
  });
  qualitySlider.addEventListener('input', () => { qualityValue.textContent = qualitySlider.value; });
  formatSelect.addEventListener('change', () => {
    const isPNG = formatSelect.value === 'image/png';
    qualitySlider.disabled = isPNG;
    qualitySlider.style.opacity = isPNG ? '0.5' : '1';
  });
  compressBtn.addEventListener('click', () => {
    if (!selectedFiles.length) { alert('Add images first.'); return; }
    const quality = qualitySlider.value / 100; const mime = formatSelect.value;
    compressBtn.disabled = true; compressBtn.textContent = 'Compressing...'; showSpinner();
    let completed = 0;
    selectedFiles.forEach((file, index) => {
      const img = new Image(); img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
        canvas.toBlob(blob => {
          const url = URL.createObjectURL(blob); const card = previewGrid.children[index];
          if (card) {
            card.querySelector('img').src = url;
            const compSpan = card.querySelector(`#compSize-${index}`); if (compSpan) compSpan.textContent = formatBytes(blob.size);
            if (!card.querySelector('.download-btn')) {
              const btn = document.createElement('button'); btn.className = 'download-btn'; btn.textContent = 'Download';
              btn.addEventListener('click', () => { const a = document.createElement('a'); a.href = url; a.download = `compressed_${file.name.replace(/\.[^/.]+$/, '')}.${mime.split('/')[1]}`; a.click(); });
              card.appendChild(btn);
            }
            historyPanel.push(url);
          }
          completed++;
          if (completed === selectedFiles.length) { compressBtn.disabled = false; compressBtn.textContent = 'Compress All Images'; hideSpinner(); }
        }, mime, quality);
      };
    });
  });
}