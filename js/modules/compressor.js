/**
 * Compressor Module – Compress multiple images with quality control & format selection.
 * Uses Web Worker for heavy processing, shows progress, and supports undo/redo.
 */
import { setupDragDrop, formatBytes, showSpinner, hideSpinner, revokeURLs } from '../utils/helpers.js';

export function initCompressor(container, fileQueue, historyPanel) {
  // Build UI
  container.innerHTML = `
    <h2>Image Compressor</h2>
    <p class="subtitle">Drag & drop or click to upload multiple images</p>
    <div class="upload-box" id="dropZoneCompress">
      <div class="upload-content">
        <span class="upload-icon">📁</span>
        <p>Drop images here or <span class="browse">browse</span></p>
        <input type="file" id="fileInputCompress" multiple accept="image/*" hidden>
      </div>
    </div>
    <div class="controls">
      <div class="control-group">
        <label for="qualitySlider">Quality: <span id="qualityValue">70</span>%</label>
        <input type="range" id="qualitySlider" min="10" max="100" value="70">
      </div>
      <div class="control-group">
        <label for="formatSelectCompress">Output Format:</label>
        <select id="formatSelectCompress">
          <option value="image/jpeg">JPEG</option>
          <option value="image/png">PNG</option>
          <option value="image/webp">WebP</option>
        </select>
      </div>
    </div>
    <button class="btn btn-primary compress-all" id="compressBtn">Compress All Images</button>
    <div class="preview-grid" id="previewGridCompress"></div>
  `;

  const dropZone = document.getElementById('dropZoneCompress');
  const fileInput = document.getElementById('fileInputCompress');
  const qualitySlider = document.getElementById('qualitySlider');
  const qualityValue = document.getElementById('qualityValue');
  const formatSelect = document.getElementById('formatSelectCompress');
  const compressBtn = document.getElementById('compressBtn');
  const previewGrid = document.getElementById('previewGridCompress');
  
  let selectedFiles = [];

  // Drag/drop setup
  setupDragDrop(dropZone, fileInput, (files) => {
    const images = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!images.length) {
      alert('Please select valid image files.');
      return;
    }
    selectedFiles = images;
    renderPreviews();
  });

  function renderPreviews() {
    previewGrid.innerHTML = '';
    selectedFiles.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const card = document.createElement('div');
        card.className = 'preview-card';
        card.innerHTML = `
          <img src="${e.target.result}" alt="${file.name}">
          <div class="preview-info">
            <p><strong>${file.name}</strong></p>
            <div class="size-row">
              <span>Original: ${formatBytes(file.size)}</span>
              <span class="compressed-size" id="compSize-${idx}">—</span>
            </div>
          </div>
        `;
        previewGrid.appendChild(card);
      };
      reader.readAsDataURL(file);
    });
  }

  qualitySlider.addEventListener('input', () => {
    qualityValue.textContent = qualitySlider.value;
  });

  // Disable quality for PNG (lossless)
  formatSelect.addEventListener('change', () => {
    const isPNG = formatSelect.value === 'image/png';
    qualitySlider.disabled = isPNG;
    qualitySlider.style.opacity = isPNG ? '0.5' : '1';
  });

  compressBtn.addEventListener('click', () => {
    if (!selectedFiles.length) {
      alert('Add images first.');
      return;
    }
    const quality = qualitySlider.value / 100;
    const mime = formatSelect.value;
    compressBtn.disabled = true;
    compressBtn.textContent = 'Compressing...';
    showSpinner();

    let completed = 0;
    selectedFiles.forEach((file, index) => {
      // ✅ Fixed: Worker path relative to index.html
      const worker = new Worker('js/utils/imageWorker.js');
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          createImageBitmap(img).then(bitmap => {
            worker.postMessage({
              imageBitmap: bitmap,
              width: img.width,
              height: img.height,
              quality: quality,
              format: mime
            }, [bitmap]);
          });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);

      worker.onmessage = (e) => {
        if (e.data.error) {
          console.error('Worker error:', e.data.error);
        } else {
          const blob = e.data.blob;
          const url = URL.createObjectURL(blob);
          const card = previewGrid.children[index];
          if (card) {
            const imgEl = card.querySelector('img');
            imgEl.src = url;
            const compSpan = card.querySelector(`#compSize-${index}`);
            if (compSpan) compSpan.textContent = formatBytes(blob.size);

            // Add download button if not present
            if (!card.querySelector('.download-btn')) {
              const btn = document.createElement('button');
              btn.className = 'download-btn';
              btn.textContent = 'Download';
              btn.addEventListener('click', () => {
                const a = document.createElement('a');
                a.href = url;
                const ext = mime.split('/')[1];
                a.download = `compressed_${file.name.replace(/\.[^/.]+$/, '')}.${ext}`;
                a.click();
              });
              card.appendChild(btn);
            }

            // Push to history for undo
            historyPanel.push(url);
          }
        }
        completed++;
        if (completed === selectedFiles.length) {
          compressBtn.disabled = false;
          compressBtn.textContent = 'Compress All Images';
          hideSpinner();
        }
        worker.terminate();
      };
    });
  });
}