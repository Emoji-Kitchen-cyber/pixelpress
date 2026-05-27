// ============================
// PixelPress Background Remover
// ============================

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const queuePreview = document.getElementById('queuePreview');
const resultGrid = document.getElementById('resultGrid');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const uploadStep = document.getElementById('uploadStep');
const settingsStep = document.getElementById('settingsStep');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const batchProgressDiv = document.getElementById('batchProgress');

let filesToProcess = [];
let processedBlobs = {}; // filename -> { blob, url }

// Drag & Drop / Click
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.borderColor = '#2563eb'; });
dropZone.addEventListener('dragleave', () => dropZone.style.borderColor = '#d1d5db');
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.style.borderColor = '#d1d5db';
  handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', e => handleFiles(e.target.files));

function handleFiles(fileList) {
  const newFiles = Array.from(fileList).filter(f => f.type.startsWith('image/')).slice(0, 10);
  if (newFiles.length === 0) return;
  filesToProcess = [...newFiles];
  renderQueuePreviews();
  startBatchProcessing();
}

function renderQueuePreviews() {
  queuePreview.innerHTML = filesToProcess.map(file => `
    <div style="text-align:center;">
      <img src="${URL.createObjectURL(file)}" style="width:80px; height:80px; object-fit:cover; border-radius:8px;">
      <small>${file.name}</small>
    </div>
  `).join('');
}

async function startBatchProcessing() {
  batchProgressDiv.style.display = 'block';
  downloadAllBtn.disabled = true;
  processedBlobs = {};
  resultGrid.innerHTML = '';

  for (let i = 0; i < filesToProcess.length; i++) {
    const file = filesToProcess[i];
    progressText.textContent = `Processing ${i+1}/${filesToProcess.length}...`;
    progressBar.value = ((i / filesToProcess.length) * 100).toFixed(0);

    try {
      const imageBlob = await fileToBlob(file);
      const resultBlob = await window.removeBackground(imageBlob, {
        model: 'medium',
        output: { format: 'image/png' }
      });
      const url = URL.createObjectURL(resultBlob);
      processedBlobs[file.name] = { blob: resultBlob, url };
      addResultCard(file, url);
    } catch (err) {
      console.error('Failed to process', file.name, err);
    }
  }
  progressBar.value = 100;
  progressText.textContent = 'Processing complete!';
  downloadAllBtn.disabled = (Object.keys(processedBlobs).length === 0);
  uploadStep.style.display = 'none';
  settingsStep.style.display = 'block';
}

function fileToBlob(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      // Convert data URL to Blob
      fetch(e.target.result).then(res => res.blob()).then(resolve);
    };
    reader.readAsDataURL(file);
  });
}

function addResultCard(originalFile, processedUrl) {
  const card = document.createElement('div');
  card.style.width = '200px';
  card.innerHTML = `
    <div class="comparison-slider" id="slider-${originalFile.name.replace(/\s/g,'')}">
      <img src="${URL.createObjectURL(originalFile)}" alt="before">
      <img class="img-after" src="${processedUrl}" alt="after" style="clip-path: inset(0 50% 0 0);">
      <div class="slider-handle" style="left:50%;">
        <div class="handle-circle">⇔</div>
      </div>
    </div>
    <div style="text-align:center; margin-top:5px;">
      <button class="btn-outline download-single" data-url="${processedUrl}" data-name="removed-bg-${originalFile.name}">Download</button>
    </div>
  `;
  resultGrid.appendChild(card);

  // Add comparison slider interaction
  const slider = card.querySelector('.comparison-slider');
  const handle = slider.querySelector('.slider-handle');
  const afterImg = slider.querySelector('.img-after');
  let isDragging = false;

  function updateSlider(clientX) {
    const rect = slider.getBoundingClientRect();
    let pos = (clientX - rect.left) / rect.width;
    pos = Math.max(0, Math.min(1, pos));
    afterImg.style.clipPath = `inset(0 ${100 - pos*100}% 0 0)`;
    handle.style.left = `${pos*100}%`;
  }

  handle.addEventListener('mousedown', (e) => {
    isDragging = true;
    e.preventDefault();
  });
  window.addEventListener('mousemove', (e) => {
    if (isDragging) updateSlider(e.clientX);
  });
  window.addEventListener('mouseup', () => { isDragging = false; });

  // Touch support
  handle.addEventListener('touchstart', (e) => {
    isDragging = true;
    e.preventDefault();
  });
  window.addEventListener('touchmove', (e) => {
    if (isDragging) updateSlider(e.touches[0].clientX);
  });
  window.addEventListener('touchend', () => { isDragging = false; });

  // Single download
  card.querySelector('.download-single').addEventListener('click', (e) => {
    const btn = e.target;
    const a = document.createElement('a');
    a.href = btn.dataset.url;
    a.download = btn.dataset.name;
    a.click();
  });
}

// Download all as ZIP
downloadAllBtn.addEventListener('click', async () => {
  const zip = new JSZip();
  for (const [name, data] of Object.entries(processedBlobs)) {
    zip.file(`removed-bg-${name}`, data.blob);
  }
  const content = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(content);
  a.download = 'pixelpress-removed-backgrounds.zip';
  a.click();
});