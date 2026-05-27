// ============================================================
// PixelPress Background Remover – Fixed with Transformers.js
// ============================================================

// UI elements
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

// State
let processedResults = [];
let customBackgroundImage = null;
let segmentationPipeline = null;  // Transformers pipeline

// ---- Model loading ----
async function loadModel() {
  loadingOverlay.style.display = 'flex';
  loadingMsg.textContent = 'Downloading AI model...';
  modelProgress.value = 0;
  loadingSubMsg.textContent = '';

  if (!window.transformers) {
    throw new Error('Transformers.js failed to load. Please check your internet connection.');
  }

  const { pipeline } = window.transformers;

  // Create pipeline with progress callback
  segmentationPipeline = await pipeline('image-segmentation', 'briaai/RMBG-1.4', {
    progress_callback: (progress) => {
      if (progress.status === 'progress') {
        modelProgress.value = Math.round(progress.progress || 0);
        loadingSubMsg.textContent = progress.file || '';
      } else if (progress.status === 'done') {
        modelProgress.value = 100;
        loadingSubMsg.textContent = '';
      }
    },
    // Force WASM if WebGPU not available (Transformers.js handles fallback automatically)
    // device: 'wasm'  // Uncomment to force WASM if you experience WebGPU issues
  });

  loadingMsg.textContent = 'Model loaded!';
  setTimeout(() => { loadingOverlay.style.display = 'none'; }, 600);
}

// ---- Init model on page load ----
loadModel().catch(err => {
  loadingMsg.textContent = 'Failed to load AI model.';
  loadingSubMsg.textContent = err.message;
  setTimeout(() => { loadingOverlay.style.display = 'none'; }, 3000);
  console.error(err);
});

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
  if (!segmentationPipeline) {
    alert('AI model is still loading. Please wait a moment.');
    return;
  }
  startProcessing(files);
}

// ---- Processing ----
async function startProcessing(files) {
  progressContainer.style.display = 'block';
  resultsSection.style.display = 'none';
  processedResults = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    progressStatus.textContent = `Removing background ${i+1}/${files.length}...`;
    batchProgress.value = ((i / files.length) * 100).toFixed(0);

    try {
      const originalBlob = await fileToBlob(file);
      const cutoutBlob = await removeBackground(originalBlob);

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
        errorMsg: err.message
      });
    }
  }

  batchProgress.value = 100;
  progressStatus.textContent = 'All done!';
  renderResults();
  resultsSection.style.display = 'block';
}

// Core removal using Transformers.js
async function removeBackground(imageBlob) {
  const inputImage = await blobToImageElement(imageBlob);
  
  // Segment
  const result = await segmentationPipeline(inputImage);
  // result is an array of { mask, label } (label='background' or 'foreground')
  // We need the foreground mask (where label is not 'background')
  // In RMBG-1.4, output is a single mask where white = foreground.
  
  // Create canvas to apply mask
  const canvas = document.createElement('canvas');
  canvas.width = inputImage.width;
  canvas.height = inputImage.height;
  const ctx = canvas.getContext('2d');
  
  // Draw original
  ctx.drawImage(inputImage, 0, 0);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const mask = result[0].mask;  // The model returns only one mask, foreground probability 0-255
  
  // Resize mask to canvas size if necessary (it should match)
  const maskCanvas = mask; // It's a RawImage or tensor; we need to get pixel data.
  // Transformers returns a Float32Array mask; we need to convert to alpha.
  // We'll use the result.mask.toCanvas() method available in newer versions,
  // or manually extract.
  
  let maskData;
  if (mask.toCanvas) {
    // Newer API
    const maskImage = await mask.toCanvas();
    maskData = maskImage.getContext('2d').getImageData(0,0,maskImage.width,maskImage.height).data;
  } else {
    // Older API: mask is a Float32Array of shape [1, h, w]
    const { data, width, height } = mask;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    const imgData = tempCtx.createImageData(width, height);
    for (let i = 0; i < data.length; i++) {
      const val = Math.round(data[i] * 255);
      imgData.data[i*4] = val;
      imgData.data[i*4+1] = val;
      imgData.data[i*4+2] = val;
      imgData.data[i*4+3] = 255;
    }
    tempCtx.putImageData(imgData, 0, 0);
    maskData = imgData.data; // RGBA, use R channel for alpha
    // Actually, we need the mask as grayscale; we can use it directly.
  }
  
  // Apply mask: set alpha = foreground probability
  for (let i = 0; i < imageData.data.length; i += 4) {
    // maskData is RGBA, use R channel (since mask is grayscale)
    const foreground = maskData[i] / 255;  // 0-1
    imageData.data[i+3] = Math.round(foreground * 255);
  }
  ctx.putImageData(imageData, 0, 0);
  
  // Convert to blob
  const blob = await canvasToBlob(canvas, 'image/png', 1);
  return blob;
}

// Helpers
function fileToBlob(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      fetch(e.target.result).then(r => r.blob()).then(resolve);
    };
    reader.readAsDataURL(file);
  });
}

function blobToImageElement(blob) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = URL.createObjectURL(blob);
    // Note: we do not revoke immediately because the image may be used later; we'll clean in render.
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

    // Apply feathering via blurred mask (correct method)
    if (featherPx > 0 && type !== 'transparent') {
      // Create a mask from cutout alpha, blur it, then composite
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = canvas.width;
      maskCanvas.height = canvas.height;
      const maskCtx = maskCanvas.getContext('2d');
      // Draw cutout to get its alpha channel
      maskCtx.drawImage(cutoutImg, 0, 0);
      // Extract alpha
      const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height).data;
      // Create blurred mask
      maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
      maskCtx.filter = `blur(${featherPx}px)`;
      maskCtx.drawImage(cutoutImg, 0, 0);
      maskCtx.filter = 'none';
      // Now composite: cutout destination-in with blurred mask
      ctx.save();
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(maskCanvas, 0, 0);
      ctx.restore();
    }
    
    // Draw cutout on top (transparently)
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

// Cleanup object URLs periodically (optional, but good practice)
window.addEventListener('beforeunload', () => {
  // nothing, browser will free memory
});

// Initial UI
solidColorCard.style.display = 'block';
gradientCard.style.display = 'none';
customBgCard.style.display = 'none';
blurCard.style.display = 'none';
outputFormat.value = 'image/png';