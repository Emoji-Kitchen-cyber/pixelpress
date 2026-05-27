// ============================================================
// PixelPress Background Remover – Self‑Hosted & Reliable
// ============================================================

import { removeBackground } from 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm';

// ── DOM refs ──────────────────────────────────────────────
const dropZone       = document.getElementById('dropZone');
const fileInput      = document.getElementById('fileInput');
const progressContainer = document.getElementById('progressContainer');
const batchProgress  = document.getElementById('batchProgress');
const progressStatus = document.getElementById('progressStatus');
const resultsSection = document.getElementById('resultsSection');
const resultGrid     = document.getElementById('resultGrid');
const applyBgBtn     = document.getElementById('applyBgBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const bgType         = document.getElementById('bgType');
const solidColorCard = document.getElementById('solidColorCard');
const gradientCard   = document.getElementById('gradientCard');
const customBgCard   = document.getElementById('customBgCard');
const blurCard       = document.getElementById('blurCard');
const solidColor     = document.getElementById('solidColor');
const gradStart      = document.getElementById('gradStart');
const gradEnd        = document.getElementById('gradEnd');
const customBgFile   = document.getElementById('customBgFile');
const blurAmount     = document.getElementById('blurAmount');
const blurValue      = document.getElementById('blurValue');
const feather        = document.getElementById('feather');
const featherValue   = document.getElementById('featherValue');
const outputFormat   = document.getElementById('outputFormat');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingMsg     = document.getElementById('loadingMsg');
const modelProgress  = document.getElementById('modelProgress');
const loadingSubMsg  = document.getElementById('loadingSubMsg');

// ── Configuration ─────────────────────────────────────────
const PUBLIC_PATH = '/models/bg-removal/';   // self‑hosted model files

const CONFIG = {
  publicPath: PUBLIC_PATH,
  model: 'medium',          // 'medium' = isnet_fp16, 'small' = isnet_quint8
  device: 'cpu',            // 'cpu' (WASM) – works everywhere; 'gpu' for WebGPU
  output: { format: 'image/png', quality: 1 },
  debug: false,
  progress: (key, current, total) => {
    const pct = total ? Math.round((current / total) * 100) : 0;
    modelProgress.value = pct;
    loadingSubMsg.textContent = `Loading ${key} …`;
    if (pct === 100) {
      loadingMsg.textContent = 'Model ready!';
      loadingSubMsg.textContent = '';
    }
  }
};

// ── State ─────────────────────────────────────────────────
let processedResults = [];
let customBackgroundImage = null;

// ── Model Preload ─────────────────────────────────────────
(async function preloadModel() {
  loadingOverlay.style.display = 'flex';
  loadingMsg.textContent = 'Loading AI model …';
  try {
    // pre‑warm with a tiny image so the library downloads & caches everything
    const tiny = new ImageData(32, 32);
    await removeBackground(tiny, CONFIG);
  } catch (e) {
    console.error('Model preload error:', e);
    loadingMsg.textContent = 'Model failed to load.';
    loadingSubMsg.textContent = 'Check that /models/bg-removal/ is accessible.';
    return;
  }
  setTimeout(() => { loadingOverlay.style.display = 'none'; }, 500);
})();

// ── File Handling ─────────────────────────────────────────
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
  startProcessing(files);
}

// ── Batch Processing ──────────────────────────────────────
async function startProcessing(files) {
  progressContainer.style.display = 'block';
  resultsSection.style.display = 'none';
  processedResults = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    progressStatus.textContent = `Removing background ${i+1}/${files.length} …`;
    batchProgress.value = ((i / files.length) * 100).toFixed(0);

    try {
      const scaled = await downscaleIfNeeded(file, 2048);
      const resultBlob = await removeBackground(scaled, CONFIG);
      const originalBlob = await fileToBlob(file);

      processedResults.push({
        file,
        originalBlob,
        cutoutBlob: resultBlob,
        currentBlob: resultBlob,
        appliedBg: 'transparent'
      });
    } catch (err) {
      console.error('Failed', file.name, err);
      processedResults.push({ file, error: true, errorMsg: err.message || 'Unknown error' });
    }
  }

  batchProgress.value = 100;
  progressStatus.textContent = 'All done!';
  renderResults();
  resultsSection.style.display = 'block';
}

// ── Helpers ───────────────────────────────────────────────
function fileToBlob(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => fetch(e.target.result).then(r => r.blob()).then(resolve);
    reader.readAsDataURL(file);
  });
}

async function downscaleIfNeeded(file, maxPx) {
  const img = await blobToImageEl(await fileToBlob(file));
  if (img.width <= maxPx && img.height <= maxPx) return file;  // small enough
  const scale = Math.min(maxPx / img.width, maxPx / img.height);
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return new Promise(r => c.toBlob(r, 'image/png', 1));
}

function blobToImageEl(blob) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = URL.createObjectURL(blob);
  });
}

function blobToImage(blob) { return blobToImageEl(blob); }

function canvasToBlob(canvas, format, quality) {
  return new Promise(resolve => canvas.toBlob(resolve, format, quality));
}

// ── Render Results ────────────────────────────────────────
function renderResults() {
  resultGrid.innerHTML = '';
  processedResults.forEach((result, idx) => {
    const card = document.createElement('div');
    card.className = 'result-card';

    if (result.error) {
      card.innerHTML = `<p style="padding:12px; text-align:center;">⚠️ ${result.errorMsg || 'Failed'}</p>`;
      resultGrid.appendChild(card);
      return;
    }

    const origUrl = URL.createObjectURL(result.originalBlob);
    const currUrl = URL.createObjectURL(result.currentBlob);

    card.innerHTML = `
      <div class="comparison-slider" id="slider-${idx}">
        <img src="${origUrl}" alt="before" class="img-before">
        <img src="${currUrl}" alt="after" class="img-after" style="clip-path: inset(0 50% 0 0);">
        <div class="slider-handle" style="left:50%;"><div class="handle-circle">⇔</div></div>
      </div>
      <div style="padding:8px; text-align:center;">
        <button class="btn-outline download-single" data-idx="${idx}">💾 Save</button>
      </div>`;
    resultGrid.appendChild(card);

    // ── before / after slider ──
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

    card.querySelector('.download-single').addEventListener('click', () => downloadSingle(result.currentBlob, result.file.name));
  });
  updateDownloadAllState();
}

// ── Background Replacement ────────────────────────────────
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

applyBgBtn.addEventListener('click', async () => {
  const type = bgType.value;
  const featherPx = parseFloat(feather.value);
  const format = outputFormat.value;
  applyBgBtn.disabled = true;
  applyBgBtn.textContent = 'Applying …';

  for (const result of processedResults) {
    if (result.error) continue;
    const cutoutImg = await blobToImage(result.cutoutBlob);
    const canvas = document.createElement('canvas');
    canvas.width = cutoutImg.width;
    canvas.height = cutoutImg.height;
    const ctx = canvas.getContext('2d');

    // background
    if (type === 'solid') {
      ctx.fillStyle = solidColor.value;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (type === 'gradient') {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, gradStart.value);
      grad.addColorStop(1, gradEnd.value);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (type === 'blur') {
      const orig = await blobToImage(result.originalBlob);
      ctx.filter = `blur(${blurAmount.value}px)`;
      ctx.drawImage(orig, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';
    } else if (type === 'custom' && customBackgroundImage) {
      ctx.drawImage(customBackgroundImage, 0, 0, canvas.width, canvas.height);
    } else if (type !== 'transparent') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // feathering
    if (featherPx > 0 && type !== 'transparent') {
      const mask = document.createElement('canvas');
      mask.width = canvas.width;
      mask.height = canvas.height;
      const mCtx = mask.getContext('2d');
      mCtx.drawImage(cutoutImg, 0, 0);
      mCtx.filter = `blur(${featherPx}px)`;
      mCtx.drawImage(cutoutImg, 0, 0);
      mCtx.filter = 'none';
      ctx.save();
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(mask, 0, 0);
      ctx.restore();
    }

    ctx.drawImage(cutoutImg, 0, 0);
    result.currentBlob = await canvasToBlob(canvas, format, 0.95);
    result.appliedBg = type;
  }

  renderResults();
  applyBgBtn.disabled = false;
  applyBgBtn.textContent = 'Apply Background to All';
});

// ── Download ──────────────────────────────────────────────
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
    zip.file(`nobg-${res.file.name.replace(/\.[^.]+$/, '')}.${ext}`, res.currentBlob);
  }
  const content = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(content);
  a.download = 'pixelpress-background-removed.zip';
  a.click();
});

function updateDownloadAllState() {
  downloadAllBtn.disabled = !processedResults.some(r => !r.error && r.currentBlob);
}

// ── Init ──────────────────────────────────────────────────
solidColorCard.style.display = 'block';
gradientCard.style.display = 'none';
customBgCard.style.display = 'none';
blurCard.style.display = 'none';
outputFormat.value = 'image/png';