// ==========================================
// PixelPress Advanced Background Remover
// ==========================================

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
const gradientValue = document.getElementById('gradientValue');
const customBgFile = document.getElementById('customBgFile');
const blurAmount = document.getElementById('blurAmount');
const blurValue = document.getElementById('blurValue');
const feather = document.getElementById('feather');
const featherValue = document.getElementById('featherValue');
const outputFormat = document.getElementById('outputFormat');

// State
let filesQueue = [];                // original File objects
let originalBlobs = {};            // fileName -> original blob (for blur)
let processedResults = [];         // { file, originalBlob, cutoutBlob, processedBlob, appliedBg }
let customBackgroundImage = null;  // for custom bg

// ---- Drag & Drop / File Input ----
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
  const newFiles = Array.from(fileList).filter(f => f.type.startsWith('image/')).slice(0, 10);
  if (newFiles.length === 0) return;
  filesQueue = [...newFiles];
  startBatchProcessing();
}

// ---- Batch Processing ----
async function startBatchProcessing() {
  progressContainer.style.display = 'block';
  resultsSection.style.display = 'none';
  processedResults = [];
  originalBlobs = {};

  for (let i = 0; i < filesQueue.length; i++) {
    const file = filesQueue[i];
    progressStatus.textContent = `Processing ${i+1}/${filesQueue.length}...`;
    batchProgress.value = ((i / filesQueue.length) * 100).toFixed(0);

    try {
      // Convert file to blob for library
      const imgBlob = await fileToBlob(file);
      originalBlobs[file.name] = imgBlob;

      // Remove background
      const cutoutBlob = await window.removeBackground(imgBlob, {
        model: 'medium',
        output: { format: 'image/png' } // always PNG for transparency
      });

      processedResults.push({
        file,
        originalBlob: imgBlob,
        cutoutBlob,
        processedBlob: cutoutBlob, // initially same
        appliedBg: 'transparent'
      });
    } catch (err) {
      console.error('Failed to process', file.name, err);
      // Still add with error flag
      processedResults.push({
        file,
        error: true,
        originalBlob: null,
        cutoutBlob: null,
        processedBlob: null
      });
    }
  }

  batchProgress.value = 100;
  progressStatus.textContent = 'Processing complete!';
  renderResults();
  resultsSection.style.display = 'block';
}

function fileToBlob(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      fetch(e.target.result).then(res => res.blob()).then(resolve);
    };
    reader.readAsDataURL(file);
  });
}

// ---- Render Results with Before/After Sliders ----
function renderResults() {
  resultGrid.innerHTML = '';
  processedResults.forEach((result, idx) => {
    if (result.error) {
      const card = document.createElement('div');
      card.className = 'result-card';
      card.innerHTML = `<p style="padding:10px;">⚠️ Failed to process ${result.file.name}</p>`;
      resultGrid.appendChild(card);
      return;
    }

    const card = document.createElement('div');
    card.className = 'result-card';
    const originalUrl = URL.createObjectURL(result.originalBlob);
    const cutoutUrl = URL.createObjectURL(result.cutoutBlob);

    card.innerHTML = `
      <div class="comparison-slider" id="slider-${idx}">
        <img src="${originalUrl}" alt="before" class="img-before">
        <img src="${cutoutUrl}" alt="after" class="img-after" style="clip-path: inset(0 50% 0 0);">
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
    let isDragging = false;

    function updateSlider(clientX) {
      const rect = slider.getBoundingClientRect();
      let pos = (clientX - rect.left) / rect.width;
      pos = Math.max(0, Math.min(1, pos));
      afterImg.style.clipPath = `inset(0 ${100 - pos*100}% 0 0)`;
      handle.style.left = `${pos*100}%`;
    }

    handle.addEventListener('mousedown', (e) => { isDragging = true; e.preventDefault(); });
    window.addEventListener('mousemove', (e) => { if (isDragging) updateSlider(e.clientX); });
    window.addEventListener('mouseup', () => { isDragging = false; });
    handle.addEventListener('touchstart', (e) => { isDragging = true; e.preventDefault(); });
    window.addEventListener('touchmove', (e) => { if (isDragging) updateSlider(e.touches[0].clientX); });
    window.addEventListener('touchend', () => { isDragging = false; });

    // Single download button
    card.querySelector('.download-single').addEventListener('click', () => {
      downloadSingle(result.processedBlob, result.file.name);
    });
  });

  updateDownloadAllState();
}

// ---- Background Replacement ----
bgType.addEventListener('change', () => {
  solidColorCard.style.display = bgType.value === 'solid' ? 'block' : 'none';
  gradientCard.style.display = bgType.value === 'gradient' ? 'block' : 'none';
  customBgCard.style.display = bgType.value === 'custom' ? 'block' : 'none';
  blurCard.style.display = bgType.value === 'blur' ? 'block' : 'none';

  // Adjust output format suggestion
  if (bgType.value === 'transparent') {
    outputFormat.value = 'image/png';
  }
});

blurAmount.addEventListener('input', () => {
  blurValue.textContent = blurAmount.value + 'px';
});
feather.addEventListener('input', () => {
  featherValue.textContent = feather.value;
});

// Listen for custom bg file
customBgFile.addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => customBackgroundImage = img;
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Apply background to all
applyBgBtn.addEventListener('click', async () => {
  applyBgBtn.disabled = true;
  const type = bgType.value;
  const featherPx = parseFloat(feather.value);
  const format = outputFormat.value;
  const isTransparent = (type === 'transparent');

  for (let i = 0; i < processedResults.length; i++) {
    const res = processedResults[i];
    if (res.error) continue;
    const cutoutImg = await blobToImage(res.cutoutBlob);
    const canvas = document.createElement('canvas');
    canvas.width = cutoutImg.width;
    canvas.height = cutoutImg.height;
    const ctx = canvas.getContext('2d');

    // Draw background
    if (type === 'solid') {
      ctx.fillStyle = solidColor.value;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (type === 'gradient') {
      // Use CSS gradient via an off-screen div
      const tmpCanvas = createGradientCanvas(gradientValue.value, canvas.width, canvas.height);
      ctx.drawImage(tmpCanvas, 0, 0);
    } else if (type === 'blur') {
      // Blur the original image as background
      const bgImg = await blobToImage(res.originalBlob);
      ctx.filter = `blur(${blurAmount.value}px)`;
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';
    } else if (type === 'custom' && customBackgroundImage) {
      ctx.drawImage(customBackgroundImage, 0, 0, canvas.width, canvas.height);
    } // if transparent, leave canvas empty (transparent)

    // Apply feathering by drawing cutout with soft mask (simplified: global composite)
    if (featherPx > 0) {
      // Create temporary canvas for feathered cutout
      const featherCanvas = document.createElement('canvas');
      featherCanvas.width = canvas.width;
      featherCanvas.height = canvas.height;
      const fCtx = featherCanvas.getContext('2d');
      fCtx.filter = `blur(${featherPx}px)`;
      fCtx.drawImage(cutoutImg, 0, 0);
      fCtx.filter = 'none';
      // composite with destination-in
      ctx.save();
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(featherCanvas, 0, 0);
      ctx.restore();
    } else {
      ctx.drawImage(cutoutImg, 0, 0);
    }

    // Convert to blob with selected format
    const blob = await canvasToBlob(canvas, format, 0.95);
    res.processedBlob = blob;
    res.appliedBg = type;
  }

  // Re-render the before/after views with updated after images
  renderResults();
  applyBgBtn.disabled = false;
});

// Helper: load image from blob
function blobToImage(blob) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = URL.createObjectURL(blob);
  });
}

// Helper: convert canvas to blob
function canvasToBlob(canvas, format, quality) {
  return new Promise(resolve => {
    canvas.toBlob(resolve, format, quality);
  });
}

// Helper: create gradient canvas from CSS gradient string
function createGradientCanvas(gradientCSS, width, height) {
  const offCanvas = document.createElement('canvas');
  offCanvas.width = width;
  offCanvas.height = height;
  const ctx = offCanvas.getContext('2d');
  // Use an offscreen element to parse gradient
  const div = document.createElement('div');
  div.style.width = `${width}px`;
  div.style.height = `${height}px`;
  div.style.background = gradientCSS;
  document.body.appendChild(div);
  // Draw div onto canvas using foreignObject? Not possible directly.
  // Simplification: use a fallback solid color
  // Better: use built-in canvas gradient creation if we parse the string.
  // For this app, we'll fallback to a simple gradient.
  ctx.fillStyle = gradientCSS;
  ctx.fillRect(0, 0, width, height);
  document.body.removeChild(div);
  return offCanvas;
}

// ---- Download ----
function downloadSingle(blob, originalName) {
  const ext = outputFormat.value.split('/')[1] || 'png';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `nobg-${originalName.replace(/\.[^/.]+$/, '')}.${ext}`;
  a.click();
}

downloadAllBtn.addEventListener('click', async () => {
  const zip = new JSZip();
  for (const res of processedResults) {
    if (res.error || !res.processedBlob) continue;
    const ext = outputFormat.value.split('/')[1] || 'png';
    const name = `nobg-${res.file.name.replace(/\.[^/.]+$/, '')}.${ext}`;
    zip.file(name, res.processedBlob);
  }
  const content = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(content);
  a.download = 'pixelpress-background-removed.zip';
  a.click();
});

function updateDownloadAllState() {
  downloadAllBtn.disabled = processedResults.some(r => !r.error && !r.processedBlob);
}

// ---- Initial UI ----
solidColorCard.style.display = 'block'; // default solid
gradientCard.style.display = 'none';
customBgCard.style.display = 'none';
blurCard.style.display = 'none';