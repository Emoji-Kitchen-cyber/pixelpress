// ==========================================
// PixelPress Advanced Image Converter
// ==========================================

const fileInput = document.getElementById('fileInput');
const uploadZone = document.getElementById('uploadZone');
const queueList = document.getElementById('queueList');
const queueContainer = document.getElementById('queueContainer');
const settingsPanel = document.getElementById('settingsPanel');
const convertAllBtn = document.getElementById('convertAllBtn');
const downloadZipBtn = document.getElementById('downloadZipBtn');
const formatSelect = document.getElementById('formatSelect');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const smartRecommend = document.getElementById('smartRecommend');
const presetSelect = document.getElementById('presetSelect');
const resizeWidth = document.getElementById('resizeWidth');
const resizeHeight = document.getElementById('resizeHeight');
const keepAspect = document.getElementById('keepAspect');
const lockAspectBtn = document.getElementById('lockAspect');
const stripMeta = document.getElementById('stripMeta');
const progressBar = document.getElementById('progressBar');
const processingStatus = document.getElementById('processingStatus');
const resultPreview = document.getElementById('resultPreview');
const clearQueueBtn = document.getElementById('clearQueueBtn');
const historyBtn = document.getElementById('historyBtn');
const queueCountSpan = document.getElementById('queueCount');

let aspectRatioLocked = false;
let originalAspect = 1;
let filesQueue = [];
let convertedBlobs = {}; // filename -> Blob
let conversionHistory = [];

// Worker – corrected path: both files in the same js/ folder
const worker = new Worker('./js/convert-worker.js');

// ---- Drag & Drop ----
uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('dragover', e => {
  e.preventDefault();
  uploadZone.classList.add('dragover');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', e => handleFiles(e.target.files));

function handleFiles(fileList) {
  const newFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
  filesQueue = [...filesQueue, ...newFiles];
  renderQueue();
  if (filesQueue.length > 0) {
    queueContainer.style.display = 'block';
    settingsPanel.style.display = 'block';
  }
}

function renderQueue() {
  queueCountSpan.textContent = filesQueue.length;
  queueList.innerHTML = filesQueue.map((file, idx) => `
    <li class="queue-item">
      <img src="${URL.createObjectURL(file)}" alt="preview" onload="this.parentNode.querySelector('.size').textContent='${(file.size/1024).toFixed(1)} KB'">
      <div style="flex:1;">
        <strong>${file.name}</strong><br>
        <small class="size">${(file.size/1024).toFixed(1)} KB</small>
      </div>
      <button class="btn btn-danger" data-index="${idx}">✕</button>
    </li>
  `).join('');

  // Remove buttons
  document.querySelectorAll('.queue-item button').forEach(btn => {
    btn.addEventListener('click', e => {
      const idx = parseInt(e.target.dataset.index);
      filesQueue.splice(idx, 1);
      renderQueue();
      if (filesQueue.length === 0) {
        queueContainer.style.display = 'none';
        settingsPanel.style.display = 'none';
      }
    });
  });

  // Smart format recommendation for first image
  if (filesQueue.length > 0) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        recommendFormat(img);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(filesQueue[0]);
  }
}

function recommendFormat(img) {
  const hasTransparency = checkTransparency(img);
  const isPhotographic = (img.width > 100 && img.height > 100);
  let recommendation = '';
  if (hasTransparency) {
    recommendation = 'Image has transparency → recommend PNG or WebP.';
    formatSelect.value = 'image/png';
  } else if (isPhotographic) {
    recommendation = 'Photo detected → recommend WebP (best compression).';
    formatSelect.value = 'image/webp';
  } else {
    recommendation = 'Graphic detected → PNG may be sharper.';
  }
  smartRecommend.style.display = 'block';
  smartRecommend.textContent = recommendation;
}

function checkTransparency(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  for (let i = 3; i < imageData.length; i += 4) {
    if (imageData[i] < 255) return true;
  }
  return false;
}

// ---- Settings ----
qualitySlider.addEventListener('input', () => {
  qualityValue.textContent = Math.round(qualitySlider.value * 100) + '%';
});
presetSelect.addEventListener('change', () => {
  const preset = presetSelect.value;
  switch(preset) {
    case 'web-optimize':
      formatSelect.value = 'image/webp';
      qualitySlider.value = 0.8;
      qualityValue.textContent = '80%';
      break;
    case 'instagram-square':
      resizeWidth.value = 1080; resizeHeight.value = 1080; keepAspect.checked = true;
      break;
    case 'facebook-cover':
      resizeWidth.value = 820; resizeHeight.value = 312; keepAspect.checked = true;
      break;
    case 'twitter-post':
      resizeWidth.value = 1200; resizeHeight.value = 675; keepAspect.checked = true;
      break;
    case 'thumbnail':
      resizeWidth.value = 150; resizeHeight.value = 150; keepAspect.checked = true;
      break;
  }
});

lockAspectBtn.addEventListener('click', () => {
  aspectRatioLocked = !aspectRatioLocked;
  lockAspectBtn.textContent = aspectRatioLocked ? '🔓' : '🔒';
  if (aspectRatioLocked && resizeWidth.value && resizeHeight.value) {
    originalAspect = resizeWidth.value / resizeHeight.value;
  }
});

resizeWidth.addEventListener('input', () => {
  if (aspectRatioLocked && resizeWidth.value) {
    resizeHeight.value = Math.round(resizeWidth.value / originalAspect);
  }
});
resizeHeight.addEventListener('input', () => {
  if (aspectRatioLocked && resizeHeight.value) {
    resizeWidth.value = Math.round(resizeHeight.value * originalAspect);
  }
});

// ---- Conversion ----
convertAllBtn.addEventListener('click', () => startConversion());
downloadZipBtn.addEventListener('click', () => downloadAsZip());

function startConversion() {
  if (filesQueue.length === 0) return;
  convertedBlobs = {};
  resultPreview.innerHTML = '';
  downloadZipBtn.disabled = true;
  progressBar.style.width = '0%';
  processingStatus.textContent = 'Processing...';
  let completed = 0;

  const total = filesQueue.length;
  const format = formatSelect.value;
  const quality = parseFloat(qualitySlider.value);
  const width = resizeWidth.value ? parseInt(resizeWidth.value) : null;
  const height = resizeHeight.value ? parseInt(resizeHeight.value) : null;
  const keepAspectRatio = keepAspect.checked;
  const removeMeta = stripMeta.checked;

  filesQueue.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      worker.postMessage({
        imageData: e.target.result,
        format,
        quality,
        width,
        height,
        keepAspectRatio,
        removeMeta,
        fileName: file.name
      });
    };
    reader.readAsDataURL(file);
  });

  worker.onmessage = function(e) {
    const { blob, fileName, error } = e.data;
    if (error) {
      console.error('Worker error:', error);
      completed++;
    } else {
      const url = URL.createObjectURL(blob);
      convertedBlobs[fileName] = { blob, url };
      const img = document.createElement('img');
      img.src = url;
      resultPreview.appendChild(img);
      completed++;
    }

    const percent = Math.round((completed / total) * 100);
    progressBar.style.width = percent + '%';
    processingStatus.textContent = `${completed}/${total} completed`;

    if (completed === total) {
      processingStatus.textContent = 'All conversions completed!';
      downloadZipBtn.disabled = false;
      const entry = {
        date: new Date().toISOString(),
        format,
        quality,
        fileCount: total
      };
      conversionHistory.push(entry);
      localStorage.setItem('convertHistory', JSON.stringify(conversionHistory));
    }
  };
}

function downloadAsZip() {
  if (Object.keys(convertedBlobs).length === 0) return;
  const zip = new JSZip();
  for (const [name, data] of Object.entries(convertedBlobs)) {
    const ext = formatSelect.value.split('/')[1];
    const newName = name.replace(/\.[^/.]+$/, '') + '.' + ext;
    zip.file(newName, data.blob);
  }
  zip.generateAsync({ type: 'blob' }).then(content => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = 'pixelpress-converted.zip';
    a.click();
  });
}

clearQueueBtn.addEventListener('click', () => {
  filesQueue = [];
  convertedBlobs = {};
  renderQueue();
  queueContainer.style.display = 'none';
  settingsPanel.style.display = 'none';
  resultPreview.innerHTML = '';
  downloadZipBtn.disabled = true;
});

historyBtn.addEventListener('click', () => {
  const stored = localStorage.getItem('convertHistory');
  if (stored) conversionHistory = JSON.parse(stored);
  if (conversionHistory.length === 0) {
    alert('No conversion history yet.');
    return;
  }
  const last = conversionHistory.slice(-5).reverse();
  const msg = last.map(h => `${new Date(h.date).toLocaleString()}: ${h.fileCount} files → ${h.format} q=${h.quality}`).join('\n');
  alert('Last 5 conversions:\n' + msg);
});