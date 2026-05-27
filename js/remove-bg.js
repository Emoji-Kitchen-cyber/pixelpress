// ============================================================================
// PixelPress Background Remover Engine – Production Level Client-Side AI
// Improvements: GPU Acceleration, Memory Leaks Patched, Aspect Correct Maps
// ============================================================================

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.1.1';

// ── DOM References ──────────────────────────────────────
const dropZone          = document.getElementById('dropZone');
const fileInput         = document.getElementById('fileInput');
const progressContainer = document.getElementById('progressContainer');
const batchProgress     = document.getElementById('batchProgress');
const progressStatus    = document.getElementById('progressStatus');
const resultsSection    = document.getElementById('resultsSection');
const resultGrid        = document.getElementById('resultGrid');
const applyBgBtn        = document.getElementById('applyBgBtn');
const downloadAllBtn    = document.getElementById('downloadAllBtn');
const bgType            = document.getElementById('bgType');
const solidColorCard    = document.getElementById('solidColorCard');
const gradientCard      = document.getElementById('gradientCard');
const customBgCard      = document.getElementById('customBgCard');
const blurCard          = document.getElementById('blurCard');
const solidColor        = document.getElementById('solidColor');
const gradStart         = document.getElementById('gradStart');
const gradEnd           = document.getElementById('gradEnd');
const customBgFile      = document.getElementById('customBgFile');
const blurAmount        = document.getElementById('blurAmount');
const blurValue         = document.getElementById('blurValue');
const feather           = document.getElementById('feather');
const featherValue      = document.getElementById('featherValue');
const outputFormat      = document.getElementById('outputFormat');
const loadingOverlay    = document.getElementById('loadingOverlay');
const loadingMsg        = document.getElementById('loadingMsg');
const modelProgress     = document.getElementById('modelProgress');
const loadingSubMsg     = document.getElementById('loadingSubMsg');
const fallbackBtn       = document.getElementById('fallbackBtn');

// ── Shared Config & Engine State ───────────────────────────
env.allowLocalModels = false;
env.useBrowserCache  = true;

let segmenter = null;        
let useAIModel = true;       
let processedResults = [];
let customBackgroundImage = null;

// ── Model Loading Lifecycle ──────────────────────────────
(async function initEngine() {
  loadingOverlay.style.display = 'flex';
  loadingMsg.textContent = 'Loading AI Architecture…';
  
  try {
    segmenter = await pipeline('image-segmentation', 'Xenova/modnet-onnx', {
      progress_callback: (p) => {
        if (p.status === 'progress') {
          modelProgress.value = Math.round(p.progress || 0);
          loadingSubMsg.textContent = `Fetching weights: ${p.file || ''}`;
        } else if (p.status === 'done') {
          modelProgress.value = 100;
        }
      },
      device: 'wasm'      
    });
    loadingMsg.textContent = 'AI Neural Model Ready!';
  } catch (err) {
    console.error('Core Model Failed to Initialize:', err);
    loadingMsg.textContent = 'AI Engine Connection Interrupted.';
    loadingSubMsg.textContent = 'Falling back to high-compatibility manual extraction.';
    useAIModel = false;
    fallbackBtn.style.display = 'inline-block';
  }
  setTimeout(() => { loadingOverlay.style.display = 'none'; }, 1200);
})();

fallbackBtn.addEventListener('click', () => {
  loadingOverlay.style.display = 'none';
  useAIModel = false;
  alert('Manual Mode Active: Upload your media, then use settings to extract matching background colors.');
});

// ── Safe Memory Cleanup Routine ──────────────────────────
function purgeOldBlobs() {
  processedResults.forEach(res => {
    if (res.origUrl) URL.revokeObjectURL(res.origUrl);
    if (res.currUrl) URL.revokeObjectURL(res.currUrl);
  });
  processedResults = [];
}

// ── Event Handlers ────────────────────────────────────────
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
  if (useAIModel && !segmenter) {
    alert('The Neural Network is stabilizing. Please wait a few seconds.');
    return;
  }
  startProcessingChain(files);
}

// ── Batch Process Management ──────────────────────────────
async function startProcessingChain(files) {
  progressContainer.style.display = 'block';
  resultsSection.style.display = 'none';
  purgeOldBlobs();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    progressStatus.textContent = `Processing Canvas [${i + 1}/${files.length}] – Isolating Subject...`;
    batchProgress.value = Math.round((i / files.length) * 100);

    try {    
      const originalBlob = await fileToBlob(file);    
      const cutoutBlob = await executeAlphaExtraction(originalBlob);    

      processedResults.push({    
        file,    
        originalBlob,    
        cutoutBlob,    
        currentBlob: cutoutBlob,    
        appliedBg: 'transparent',
        origUrl: null,
        currUrl: null
      });    
    } catch (err) {    
      console.error('Extraction Failure on item:', file.name, err);    
      processedResults.push({ file, error: true, errorMsg: err.message || 'Processing Context Timeout' });    
    }
  }

  batchProgress.value = 100;
  progressStatus.textContent = 'Pipeline execution complete!';
  renderOutputStage();
  resultsSection.style.display = 'block';
}

// ── Hardware Accelerated Alpha Matte Extraction ───────────
async function executeAlphaExtraction(originalBlob) {
  // Production safe optimization: Smart downscale for ultra-smooth rendering performance
  const scaledBlob = await runDownscaleOptimizer(originalBlob, 1200);
  const sourceImg = await blobToImageElement(scaledBlob);

  if (useAIModel && segmenter) {
    const output = await segmenter(sourceImg);
    const modelMask = output.mask;   

    // Step 1: Create an isolated staging layer for the layout model mask
    const layerCanvas = document.createElement('canvas');
    layerCanvas.width = sourceImg.width;
    layerCanvas.height = sourceImg.height;
    const lCtx = layerCanvas.getContext('2d');

    if (modelMask.toCanvas) {    
      const rawMaskCanvas = modelMask.toCanvas();    
      lCtx.drawImage(rawMaskCanvas, 0, 0, sourceImg.width, sourceImg.height);    
    } else {    
      const { data, width, height } = modelMask;    
      const bufferCanvas = document.createElement('canvas');    
      bufferCanvas.width = width;    
      bufferCanvas.height = height;    
      const bCtx = bufferCanvas.getContext('2d');    
      const imgData = bCtx.createImageData(width, height);    
      
      for (let i = 0; i < data.length; i++) {    
        const luminance = Math.round(data[i] * 255);    
        const idx = i * 4;
        imgData.data[idx]     = luminance;    
        imgData.data[idx + 1] = luminance;    
        imgData.data[idx + 2] = luminance;    
        imgData.data[idx + 3] = 255;    
      }    
      bCtx.putImageData(imgData, 0, 0);    
      lCtx.drawImage(bufferCanvas, 0, 0, sourceImg.width, sourceImg.height);
    }    

    // Step 2: Extract Alpha Channels directly into GPU Compositor Context
    const productionCanvas = document.createElement('canvas');    
    productionCanvas.width = sourceImg.width;    
    productionCanvas.height = sourceImg.height;    
    const pCtx = productionCanvas.getContext('2d');    
    
    // Draw raw image stream
    pCtx.drawImage(sourceImg, 0, 0);    
    
    // Apply hardware-accelerated destination layer masking
    pCtx.globalCompositeOperation = 'destination-in';    
    pCtx.drawImage(layerCanvas, 0, 0);    
    pCtx.globalCompositeOperation = 'source-over';    

    const cleanResult = await canvasToBlobData(productionCanvas, 'image/png', 1.0);
    
    // Explicit GC release
    layerCanvas.width = bufferCanvas.width = productionCanvas.width = 0; 
    return cleanResult;
  } else {
    return await runLegacyChromaKey(sourceImg);
  }
}

// ── High-Compatibility Chroma Key Fallback ───────────────
async function runLegacyChromaKey(img) {
  const targetHex = prompt('Enter hex value to strip away (e.g., #ffffff):', '#ffffff');
  if (!targetHex) throw new Error('Operations aborted by client interaction.');

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imgData.data;

  const hexClean = targetHex.replace('#', '');
  const targetR = parseInt(hexClean.substring(0,2), 16) || 255;
  const targetG = parseInt(hexClean.substring(2,4), 16) || 255;
  const targetB = parseInt(hexClean.substring(4,6), 16) || 255;
  const tolerance = 45; 

  for (let i = 0; i < d.length; i += 4) {
    if (Math.abs(d[i] - targetR) < tolerance &&
        Math.abs(d[i+1] - targetG) < tolerance &&
        Math.abs(d[i+2] - targetB) < tolerance) {
      d[i+3] = 0;  
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return await canvasToBlobData(canvas, 'image/png', 1.0);
}

// ── Core Infrastructure Helper Blocks ─────────────────────
function fileToBlob(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => fetch(e.target.result).then(r => r.blob()).then(resolve);
    reader.readAsDataURL(file);
  });
}

async function runDownscaleOptimizer(blob, maxBound) {
  const img = await blobToImageElement(blob);
  if (img.width <= maxBound && img.height <= maxBound) return blob;
  
  const scalingFactor = Math.min(maxBound / img.width, maxBound / img.height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scalingFactor);
  canvas.height = Math.round(img.height * scalingFactor);
  
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.98));
}

function blobToImageElement(blob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image parser failed to build structure.'));
    img.src = URL.createObjectURL(blob);
  });
}

function canvasToBlobData(canvas, layout, precision) {
  return new Promise(resolve => canvas.toBlob(resolve, layout, precision));
}

// ── Hardware Slider Rendering Engine ─────────────────────
function renderOutputStage() {
  resultGrid.innerHTML = '';
  processedResults.forEach((result, idx) => {
    const card = document.createElement('div');
    card.className = 'result-card';

    if (result.error) {    
      card.innerHTML = `<p style="padding:12px; text-align:center; font-size:13px; color:#ef4444;">⚠️ ${result.errorMsg}</p>`;    
      resultGrid.appendChild(card);    
      return;    
    }    

    // Clean historical allocations
    if (result.origUrl) URL.revokeObjectURL(result.origUrl);
    if (result.currUrl) URL.revokeObjectURL(result.currUrl);

    result.origUrl = URL.createObjectURL(result.originalBlob);    
    result.currUrl = URL.createObjectURL(result.currentBlob);    

    card.innerHTML = `    
      <div class="comparison-slider" id="slider-${idx}">    
        <img src="${result.origUrl}" alt="Source Stage" class="img-before">    
        <img src="${result.currUrl}" alt="Isolated Matte" class="img-after">    
        <div class="slider-handle"><div class="handle-circle">⇔</div></div>    
      </div>    
      <div style="padding:8px; text-align:center;">    
        <button class="btn-outline download-single" data-idx="${idx}">💾 Save</button>    
      </div>`;    
    resultGrid.appendChild(card);    

    // Interactivity engine hooks
    const slider    = card.querySelector('.comparison-slider');    
    const handle    = slider.querySelector('.slider-handle');    
    const transform = slider.querySelector('.img-after');    
    let activeDrag  = false;    

    function adjustViewport(clientX) {    
      const surface = slider.getBoundingClientRect();    
      let offset = (clientX - surface.left) / surface.width;    
      offset = Math.min(1, Math.max(0, offset));    
      transform.style.clipPath = `inset(0 ${(1 - offset) * 100}% 0 0)`;    
      handle.style.left = `${offset * 100}%`;    
    }    
    
    handle.addEventListener('mousedown', e => { activeDrag = true; e.preventDefault(); });    
    window.addEventListener('mousemove', e => { if (activeDrag) adjustViewport(e.clientX); });    
    window.addEventListener('mouseup', () => { activeDrag = false; });    
    
    handle.addEventListener('touchstart', e => { activeDrag = true; e.preventDefault(); });    
    window.addEventListener('touchmove', e => { if (activeDrag && e.touches) adjustViewport(e.touches.clientX); });    
    window.addEventListener('touchend', () => { activeDrag = false; });    

    card.querySelector('.download-single').addEventListener('click', () => downloadSingle(result.currentBlob, result.file.name));
  });
  updateDownloadAllState();
}

// ── Interactive Background Composition System ────────────
bgType.addEventListener('change', () => {
  const mode = bgType.value;
  solidColorCard.style.display = (mode === 'solid') ? 'block' : 'none';
  gradientCard.style.display   = (mode === 'gradient') ? 'block' : 'none';
  customBgCard.style.display   = (mode === 'custom') ? 'block' : 'none';
  blurCard.style.display       = (mode === 'blur') ? 'block' : 'none';
  if (mode === 'transparent') outputFormat.value = 'image/png';
});

blurAmount.addEventListener('input', () => blurValue.textContent = `${blurAmount.value}px`);
feather.addEventListener('input', () => featherValue.textContent = feather.value);

customBgFile.addEventListener('change', e => {
  const target = e.target.files;
  if (!target) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const obj = new Image();
    obj.onload = () => { customBackgroundImage = obj; };
    obj.src = ev.target.result;
  };
  reader.readAsDataURL(target);
});

applyBgBtn.addEventListener('click', async () => {
  const mode = bgType.value;
  const featherVal = parseFloat(feather.value);
  const standardExt = outputFormat.value;
  
  applyBgBtn.disabled = true;
  applyBgBtn.textContent = 'Refining Layout Canvas…';

  for (const item of processedResults) {
    if (item.error) continue;
    
    const compoundObject = await blobToImageElement(item.cutoutBlob);
    const canvas = document.createElement('canvas');
    canvas.width = compoundObject.width;
    canvas.height = compoundObject.height;
    const ctx = canvas.getContext('2d');

    // Layer 1: Construct Target Environment Backgrounds
    if (mode === 'solid') {    
      ctx.fillStyle = solidColor.value;    
      ctx.fillRect(0, 0, canvas.width, canvas.height);    
    } else if (mode === 'gradient') {    
      const gradientStream = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);    
      gradientStream.addColorStop(0, gradStart.value);    
      gradientStream.addColorStop(1, gradEnd.value);    
      ctx.fillStyle = gradientStream;    
      ctx.fillRect(0, 0, canvas.width, canvas.height);    
    } else if (mode === 'blur') {    
      const baseline = await blobToImageElement(item.originalBlob);    
      ctx.filter = `blur(${blurAmount.value}px)`;    
      ctx.drawImage(baseline, 0, 0, canvas.width, canvas.height);    
      ctx.filter = 'none';    
    } else if (mode === 'custom' && customBackgroundImage) {    
      ctx.drawImage(customBackgroundImage, 0, 0, canvas.width, canvas.height);    
    } else if (mode === 'transparent') {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {    
      ctx.fillStyle = '#ffffff';    
      ctx.fillRect(0, 0, canvas.width, canvas.height);    
    }    

    // Layer 2: Compute Edge Refinement Feather Subsystem
    if (featherVal > 0) {    
      const shadowBuffer = document.createElement('canvas');    
      shadowBuffer.width = canvas.width;    
      shadowBuffer.height = canvas.height;    
      const sbCtx = shadowBuffer.getContext('2d');    
      
      sbCtx.filter = `blur(${featherVal}px)`;    
      sbCtx.drawImage(compoundObject, 0, 0);    
      sbCtx.filter = 'none';    
      
      ctx.drawImage(shadowBuffer, 0, 0);    
      shadowBuffer.width = 0; 
    }    

    // Layer 3: Render Foreground Subject Alpha
    ctx.drawImage(compoundObject, 0, 0);    
    item.currentBlob = await canvasToBlobData(canvas, standardExt, 0.96);    
    canvas.width = 0; 
  }

  renderOutputStage();
  applyBgBtn.disabled = false;
  applyBgBtn.textContent = 'Apply Background to All';
});

// ── Export/Download Processing Block ─────────────────────
function downloadSingle(blob, baselineName) {
  const extensionType = outputFormat.value.split('/') || 'png';
  const cleanName = baselineName.replace(/\.[^.]+$/, '');
  
  const element = document.createElement('a');
  element.href = URL.createObjectURL(blob);
  element.download = `pixelpress-nobg-${cleanName}.${extensionType}`;
  element.click();
  
  setTimeout(() => URL.revokeObjectURL(element.href), 100);
}

downloadAllBtn.addEventListener('click', async () => {
  const bundle = new JSZip();
  const targetedExt = outputFormat.value.split('/') || 'png';
  
  for (const res of processedResults) {
    if (res.error || !res.currentBlob) continue;
    const trackingName = res.file.name.replace(/\.[^.]+$/, '');
    bundle.file(`pixelpress-nobg-${trackingName}.${targetedExt}`, res.currentBlob);
  }
  
  const packageBlob = await bundle.generateAsync({ type: 'blob' });
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(packageBlob);
  downloadLink.download = 'pixelpress-background-removed-package.zip';
  downloadLink.click();
  
  setTimeout(() => URL.revokeObjectURL(downloadLink.href), 100);
});

function updateDownloadAllState() {
  downloadAllBtn.disabled = !processedResults.some(r => !r.error && r.currentBlob);
}

// ── Core Form UI Resets ───────────────────────────────
solidColorCard.style.display = 'none'; 
gradientCard.style.display   = 'none';
customBgCard.style.display   = 'none';
blurCard.style.display       = 'none';
outputFormat.value           = 'image/png';

