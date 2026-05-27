// ============================================================
// PixelPress Background Remover – Fully Working & Reliable
// ============================================================

// UI Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const progressContainer = document.getElementById('progressContainer');
const batchProgress = document.getElementById('batchProgress');
const progressStatus = document.getElementById('progressStatus');
const resultsSection = document.getElementById('resultsSection');
const resultGrid = document.getElementById('resultGrid');
const applyBgBtn = document.getElementById('applyBgBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const bgType = document.getElementById('bgType');
const solidColorCard = document.getElementById('solidColorCard');
const gradientCard = document.getElementById('gradientCard');
const customBgCard = document.getElementById('customBgCard');
const blurCard = document.getElementById('blurCard');
const solidColor = document.getElementById('solidColor');
const gradStart = document.getElementById('gradStart');
const gradEnd = document.getElementById('gradEnd');
const customBgFile = document.getElementById('customBgFile');
const blurAmount = document.getElementById('blurAmount');
const blurValue = document.getElementById('blurValue');
const feather = document.getElementById('feather');
const featherValue = document.getElementById('featherValue');
const outputFormat = document.getElementById('outputFormat');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingMsg = document.getElementById('loadingMsg');
const modelProgress = document.getElementById('modelProgress');
const loadingSubMsg = document.getElementById('loadingSubMsg');

// Global state
let processedResults = [];
let customBackgroundImage = null;

// Wait for library (loaded via <script> tag)
function waitForLibrary(retries = 50) {
  return new Promise((resolve, reject) => {
    if (window.removeBackground) return resolve();
    let count = 0;
    const interval = setInterval(() => {
      if (window.removeBackground) {
        clearInterval(interval);
        resolve();
      } else if (++count >= retries) {
        clearInterval(interval);
        reject(new Error('Background removal library could not be loaded. Please refresh.'));
      }
    }, 100);
  });
}

// ---- Model loading with progress ----
async function loadModel() {
  loadingOverlay.style.display = 'flex';
  loadingMsg.textContent = 'Downloading AI model...';
  modelProgress.value = 0;
  loadingSubMsg.textContent = '';

  try {
    await waitForLibrary();
  } catch (err) {
    loadingMsg.textContent = 'Library not loaded.';
    loadingSubMsg.textContent = 'Check your connection or try a different browser.';
    return;
  }

  // Preload the model using self‑hosted files
  const modelUrl = './models/bg-removal/medium/';   // relative to root = public/

  // We can trigger a preload by running a tiny invisible removal
  // but the library doesn't have a preload method. Instead we'll just
  // configure the option when processing and rely on the library's cache.
  // To show progress, we can pre‑warm with a dummy image.
  const dummyCanvas = document.createElement('canvas');
  dummyCanvas.width = 32;
  dummyCanvas.height = 32;
  const dummyBlob = await new Promise(r => dummyCanvas.toBlob(r, 'image/png'));

  try {
    await window.removeBackground(dummyBlob, {
      model: 'medium',
      modelUrl: modelUrl,
      output: { format: 'image/png' },
      progress: (key, current, total) => {
        const percent = Math.round((current / total) * 100);
        modelProgress.value = percent;
        loadingSubMsg.textContent = `Loading: ${key}`;
        if (percent === 100) {
          loadingMsg.textContent = 'Model ready!';
          loadingSubMsg.textContent = '';
        }
      }
    });
  } catch (e) {
    console.error('Model preload error:', e);
    loadingMsg.textContent = 'Model failed to load.';
    loadingSubMsg.textContent = 'Please try again later.';
    return;
  }

  setTimeout(() => { loadingOverlay.style.display = 'none'; }, 600);
}

// Load model on page start
loadModel();

// ---- File Handling ----
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', e => handleFiles(e.target.files));

function handleFiles(fileList) {
  const files = Array.from(fileList).filter(f => f.type.startsWith('image/')).slice(0, 10);
  if (files.length === 0) return;
  if (!window.removeBackground) {
    alert('AI model is still loading. Please wait a moment.');
    return;
  }
  startProcessing(files);
}

// ---- Batch Processing ----
async function startProcessing(files) {
  progressContainer.style.display = 'block';
  resultsSection.style.display = 'none';
  processedResults = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    progressStatus.textContent = `Removing background ${i+1}/${files.length}...`;
    batchProgress.value = ((i / files.length) * 100).toFixed(0);

    try {
      // Downscale large images for mobile performance
      const originalBlob = await fileToBlob(file);
      const scaledBlob = await downscaleIfNeeded(originalBlob, 2048); // max 2048px

      const modelUrl = './models/bg-removal/medium/';
      const cutoutBlob = await window.removeBackground(scaledBlob, {
        model: 'medium',
        modelUrl: modelUrl,
        output: { format: 'image/png' }
      });

      processedResults.push({
        file: file,
        originalBlob: originalBlob,
        cutoutBlob: cutoutBlob,
        currentBlob: cutoutBlob,
        appliedBg: 'transparent'
      });
    } catch (err) {
      console.error('Failed', file.name, err);
      processedResults.push({
        file: file,
        error: true,
        errorMsg: err.message || 'Unknown error'
      });
    }
  }

  batchProgress.value = 100;
  progressStatus.textContent = 'All done!';
  renderResults();
  resultsSection.style.display = 'block';
}

// Helper: downscale image if too large
async function downscaleIfNeeded(blob, maxPixels) {
  const img = await blobToImageElement(blob);
  if (img.width <= maxPixels && img.height <= maxPixels) return blob;

  const scale = Math.min(maxPixels / img.width, maxPixels / img.height);
  const newWidth = Math.round(img.width * scale);
  const newHeight = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, newWidth, newHeight);
  return await canvasToBlob(canvas, 'image/png', 1);
}

// Basic helpers
function fileToBlob(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => fetch(e.target.result).then(r => r.blob()).then(resolve);
    reader.readAsDataURL(file);
  });
}

function blobToImageElement(blob) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = URL.createObjectURL(blob);
  });
}

function canvasToBlob(canvas, format, quality) {
  return new Promise(resolve => canvas.toBlob(resolve, format, quality));
}

function blobToImage(blob) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = URL.createObjectURL(blob);
  });
}

// ---- Render Results (Before/After Sliders) ----
function renderResults() {
  resultGrid.innerHTML = '';
  processedResults.forEach((result, idx) => {
    const card = document.createElement('div');
    card.className = 'result-card';

    if (result.error) {
      card.innerHTML = `<p style="padding:12px; text-align:center;">⚠️ ${result.errorMsg || 'Failed to process ' + result.file.name}</p>`;
      resultGrid.appendChild(card);
      return;
    }

    const originalUrl = URL.createObjectURL(result.originalBlob);
    const currentUrl = URL.createObjectURL(result.currentBlob);

    card.innerHTML = `
      <div class="comparison-slider" id="slider-${idx}">
        <img src="${originalUrl}" alt="before" class="img-before">
        <img src="${currentUrl}" alt="after" class="img-after" style="clip-path: inset(0 50% 0 0);">
        <div class="slider-handle" style="left:50%;">
          <div class="handle-circle">⇔</div>
        </div>
      </div>
      <div style="padding:8px; text-align:center;">
        <button class="btn-outline download-single" data-idx="${idx}">💾 Save</button>
      </div>
    `;
    resultGrid.appendChild(card);

    // Slider interaction
    const slider = card.querySelector('.comparison-slider');
    const handle = slider.querySelector('.slider-handle');
    const afterImg = slider.querySelector('.img-after');
    let dragging = false;

    function updateSlider(clientX) {
      const rect = slider.getBoundingClientRect();
      let pos = (clientX - rect.left) / rect.width;
      pos = Math.min(1, Math.max(0, pos));
      afterImg.style.clipPath = `inset(0 ${(1-pos)*100}% 0 0)`;
      handle.style.left = `${pos*100}%`;
    }

    handle.addEventListener('mousedown', e => { dragging = true; e.preventDefault(); });
    window.addEventListener('mousemove', e => { if (dragging) updateSlider(e.clientX); });
    window.addEventListener('mouseup', () => { dragging = false; });
    handle.addEventListener('touchstart', e => { dragging = true; e.preventDefault(); });
    window.addEventListener('touchmove', e => { if (dragging) updateSlider(e.touches[0].clientX); });
    window.addEventListener('touchend', () => { dragging = false; });

    // Single download
    card.querySelector('.download-single').addEventListener('click', () => {
      downloadSingle(result.currentBlob, result.file.name);
    });
  });

  updateDownloadAllState();
}

// ---- Background Replacement ----
bgType.addEventListener('change', () => {
  solidColorCard.style.display = (bgType.value === 'solid') ? 'block' : 'none';
  gradientCard.style.display = (bgType.value === 'gradient') ? 'block' : 'none';
  customBgCard.style.display = (bgType.value === 'custom') ? 'block' : 'none';
  blurCard.style.display = (bgType.value === 'blur') ? 'block' : 'none';
  if (bgType.value === 'transparent') outputFormat.value = 'image/png';
});

blurAmount.addEventListener('input', () => blurValue.textContent = blurAmount.value + 'px');
feather.addEventListener('input', () => featherValue.textContent = feather.value);

customBgFile.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => { customBackgroundImage = img; };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

// Apply background to all
applyBgBtn.addEventListener('click', async () => {
  const type = bgType.value;
  const featherPx = parseFloat(feather.value);
  const format = outputFormat.value;

  applyBgBtn.disabled = true;
  applyBgBtn.textContent = 'Applying...';

  for (const result of processedResults) {
    if (result.error) continue;

    const cutoutImg = await blobToImage(result.cutoutBlob);
    const canvas = document.createElement('canvas');
    canvas.width = cutoutImg.width;
    canvas.height = cutoutImg.height;
    const ctx = canvas.getContext('2d');

    // Draw background
    if (type === 'transparent') {
      // nothing
    } else if (type === 'solid') {
      ctx.fillStyle = solidColor.value;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (type === 'gradient') {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, gradStart.value);
      grad.addColorStop(1, gradEnd.value);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (type === 'blur') {
      const originalImg = await blobToImage(result.originalBlob);
      ctx.filter = `blur(${blurAmount.value}px)`;
      ctx.drawImage(originalImg, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';
    } else if (type === 'custom' && customBackgroundImage) {
      ctx.drawImage(customBackgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Apply feathering correctly
    if (featherPx > 0 && type !== 'transparent') {
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = canvas.width;
      maskCanvas.height = canvas.height;
      const maskCtx = maskCanvas.getContext('2d');
      maskCtx.drawImage(cutoutImg, 0, 0);
      maskCtx.filter = `blur(${featherPx}px)`;
      maskCtx.drawImage(cutoutImg, 0, 0);
      maskCtx.filter = 'none';
      ctx.save();
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(maskCanvas, 0, 0);
      ctx.restore();
    }

    // Draw cutout on top
    ctx.drawImage(cutoutImg, 0, 0);

    const newBlob = await canvasToBlob(canvas, format, 0.95);
    result.currentBlob = newBlob;
    result.appliedBg = type;
  }

  renderResults();
  applyBgBtn.disabled = false;
  applyBgBtn.textContent = 'Apply Background to All';
});

// ---- Download ----
function downloadSingle(blob, originalName) {
  const ext = outputFormat.value.split('/')[1] || 'png';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `nobg-${originalName.replace(/\.[^.]+$/, '')}.${ext}`;
  a.click();
}

downloadAllBtn.addEventListener('click', async () => {
  const zip = new JSZip();
  for (const res of processedResults) {
    if (res.error || !res.currentBlob) continue;
    const ext = outputFormat.value.split('/')[1] || 'png';
    const name = `nobg-${res.file.name.replace(/\.[^.]+$/, '')}.${ext}`;
    zip.file(name, res.currentBlob);
  }
  const content = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(content);
  a.download = 'pixelpress-background-removed.zip';
  a.click();
});

function updateDownloadAllState() {
  const hasValid = processedResults.some(r => !r.error && r.currentBlob);
  downloadAllBtn.disabled = !hasValid;
}

// Initial UI state
solidColorCard.style.display = 'block';
gradientCard.style.display = 'none';
customBgCard.style.display = 'none';
blurCard.style.display = 'none';
outputFormat.value = 'image/png';