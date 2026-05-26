// ==================== PIXELPRESS - IMAGE EDITOR ====================

// ---------- STATE ----------
const state = {
  currentTool: 'compress',
  originalImage: null,
  processedBlob: null,
  // Crop state
  cropStartX: 0, cropStartY: 0, cropEndX: 0, cropEndY: 0, isCropping: false,
  // Resize state
  resizeOriginalWidth: 0, resizeOriginalHeight: 0,
  // Filters state
  currentFilter: 'normal', filtersImageData: null,
  // Pixel art state
  pixelSize: 32, pixelDrawing: false, pixelTool: 'draw', pixelColor: '#ffffff',
  pixelGrid: []
};

// ---------- DOM ----------
const $ = id => document.getElementById(id);

// ---------- NAVIGATION ----------
function setupNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentTool = btn.dataset.tool;
      document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
      const panel = $(`tool-${btn.dataset.tool}`);
      if (panel) panel.classList.add('active');
      if (btn.dataset.tool === 'pixelart') initPixelArt();
    });
  });
}

// ---------- FILE UPLOAD HELPER ----------
function setupUploadZone(zoneId, inputId, onImageLoad) {
  const zone = $(zoneId);
  const input = $(inputId);
  if (!zone || !input) return;
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadImage(file, onImageLoad);
  });
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (file) loadImage(file, onImageLoad);
  });
}

function loadImage(file, callback) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => callback(img, file);
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ---------- COMPRESS TOOL ----------
function setupCompress() {
  setupUploadZone('compressUploadZone', 'compressFileInput', (img, file) => {
    state.originalImage = img;
    $('compressOriginalImg').src = img.src;
    $('compressOriginalSize').textContent = formatSize(file.size);
    $('compressPreview').style.display = 'block';
    $('compressUploadZone').style.display = 'none';
    runCompression(file);
  });
  $('compressQuality').addEventListener('input', () => {
    $('compressQualityVal').textContent = $('compressQuality').value + '%';
  });
  $('compressBtn').addEventListener('click', () => runCompression());
  $('compressDownloadBtn').addEventListener('click', () => downloadBlob(state.processedBlob, 'compressed-image'));
}

async function runCompression(originalFile) {
  const quality = parseInt($('compressQuality').value) / 100;
  const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, initialQuality: quality };
  try {
    let fileToCompress = originalFile;
    if (!fileToCompress && state.originalImage) {
      const blob = await fetch(state.originalImage.src).then(r => r.blob());
      fileToCompress = new File([blob], 'image.jpg', { type: 'image/jpeg' });
    }
    if (!fileToCompress) return;
    const compressed = await imageCompression(fileToCompress, options);
    state.processedBlob = compressed;
    const url = URL.createObjectURL(compressed);
    $('compressResultImg').src = url;
    $('compressResultSize').textContent = formatSize(compressed.size);
    const saved = fileToCompress.size - compressed.size;
    const percent = Math.round((saved / fileToCompress.size) * 100);
    $('compressSaved').textContent = `${formatSize(saved)} (${percent}%)`;
    $('compressDownloadBtn').disabled = false;
  } catch (e) {
    alert('Compression failed: ' + e.message);
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

// ---------- CROP TOOL ----------
function setupCrop() {
  setupUploadZone('cropUploadZone', 'cropFileInput', (img) => {
    state.originalImage = img;
    $('cropUploadZone').style.display = 'none';
    $('cropEditor').style.display = 'block';
    initCropCanvas(img);
  });
  $('cropApplyBtn').addEventListener('click', applyCrop);
  $('cropDownloadBtn').addEventListener('click', () => downloadCanvas($('cropCanvas'), 'cropped-image'));
  $('cropResetBtn').addEventListener('click', resetCrop);
}

function initCropCanvas(img) {
  const canvas = $('cropCanvas');
  const maxW = Math.min(window.innerWidth - 40, 800);
  const scale = Math.min(maxW / img.width, 1);
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  state.cropScale = scale;
  state.cropStartX = 0; state.cropStartY = 0;
  state.cropEndX = canvas.width; state.cropEndY = canvas.height;
  drawCropRect();

  canvas.addEventListener('mousedown', e => {
    state.isCropping = true;
    const rect = canvas.getBoundingClientRect();
    state.cropStartX = e.clientX - rect.left;
    state.cropStartY = e.clientY - rect.top;
  });
  canvas.addEventListener('mousemove', e => {
    if (!state.isCropping) return;
    const rect = canvas.getBoundingClientRect();
    state.cropEndX = Math.max(0, Math.min(e.clientX - rect.left, canvas.width));
    state.cropEndY = Math.max(0, Math.min(e.clientY - rect.top, canvas.height));
    drawCropRect();
  });
  canvas.addEventListener('mouseup', () => { state.isCropping = false; });
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    state.isCropping = true;
    const rect = canvas.getBoundingClientRect();
    state.cropStartX = e.touches[0].clientX - rect.left;
    state.cropStartY = e.touches[0].clientY - rect.top;
  });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!state.isCropping) return;
    const rect = canvas.getBoundingClientRect();
    state.cropEndX = Math.max(0, Math.min(e.touches[0].clientX - rect.left, canvas.width));
    state.cropEndY = Math.max(0, Math.min(e.touches[0].clientY - rect.top, canvas.height));
    drawCropRect();
  });
  canvas.addEventListener('touchend', () => { state.isCropping = false; });
}

function drawCropRect() {
  const canvas = $('cropCanvas');
  const ctx = canvas.getContext('2d');
  const img = state.originalImage;
  if (!img) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const x = Math.min(state.cropStartX, state.cropEndX);
  const y = Math.min(state.cropStartY, state.cropEndY);
  const w = Math.abs(state.cropEndX - state.cropStartX);
  const h = Math.abs(state.cropEndY - state.cropStartY);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, 0, canvas.width, y);
  ctx.fillRect(0, y, x, h);
  ctx.fillRect(x + w, y, canvas.width - x - w, h);
  ctx.fillRect(0, y + h, canvas.width, canvas.height - y - h);
  ctx.strokeStyle = '#ff5e7a';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

function applyCrop() {
  const canvas = document.createElement('canvas');
  const x = Math.min(state.cropStartX, state.cropEndX);
  const y = Math.min(state.cropStartY, state.cropEndY);
  const w = Math.abs(state.cropEndX - state.cropStartX);
  const h = Math.abs(state.cropEndY - state.cropStartY);
  canvas.width = w / state.cropScale;
  canvas.height = h / state.cropScale;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(state.originalImage, x / state.cropScale, y / state.cropScale, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
  const cropCanvas = $('cropCanvas');
  const mainCtx = cropCanvas.getContext('2d');
  cropCanvas.width = canvas.width;
  cropCanvas.height = canvas.height;
  mainCtx.drawImage(canvas, 0, 0);
  state.cropStartX = 0; state.cropStartY = 0;
  state.cropEndX = canvas.width; state.cropEndY = canvas.height;
  state.originalImage = new Image();
  state.originalImage.src = cropCanvas.toDataURL();
  state.cropScale = 1;
}

function resetCrop() {
  if (!state.originalImage) return;
  initCropCanvas(state.originalImage);
}

// ---------- RESIZE TOOL ----------
function setupResize() {
  setupUploadZone('resizeUploadZone', 'resizeFileInput', (img) => {
    state.originalImage = img;
    state.resizeOriginalWidth = img.width;
    state.resizeOriginalHeight = img.height;
    $('resizeWidth').value = img.width;
    $('resizeHeight').value = img.height;
    $('resizePreviewImg').src = img.src;
    $('resizeUploadZone').style.display = 'none';
    $('resizeEditor').style.display = 'block';
  });
  $('resizeWidth').addEventListener('input', () => {
    if ($('resizeLockAspect').checked) {
      $('resizeHeight').value = Math.round(($('resizeWidth').value / state.resizeOriginalWidth) * state.resizeOriginalHeight);
    }
  });
  $('resizeHeight').addEventListener('input', () => {
    if ($('resizeLockAspect').checked) {
      $('resizeWidth').value = Math.round(($('resizeHeight').value / state.resizeOriginalHeight) * state.resizeOriginalWidth);
    }
  });
  $('resizeApplyBtn').addEventListener('click', applyResize);
  $('resizeDownloadBtn').addEventListener('click', () => downloadCanvas(null, 'resized-image', true));
}

function applyResize() {
  const w = parseInt($('resizeWidth').value);
  const h = parseInt($('resizeHeight').value);
  if (!w || !h || !state.originalImage) return;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(state.originalImage, 0, 0, w, h);
  $('resizePreviewImg').src = canvas.toDataURL();
  state.resizeResultCanvas = canvas;
  state.resizeOriginalWidth = w;
  state.resizeOriginalHeight = h;
}

function downloadCanvas(sourceCanvas, filename, useResizeResult) {
  let canvas;
  if (useResizeResult && state.resizeResultCanvas) {
    canvas = state.resizeResultCanvas;
  } else if (sourceCanvas) {
    canvas = sourceCanvas;
  } else {
    return;
  }
  canvas.toBlob(blob => downloadBlob(blob, filename));
}

// ---------- FILTERS TOOL ----------
function setupFilters() {
  setupUploadZone('filtersUploadZone', 'filtersFileInput', (img) => {
    state.originalImage = img;
    $('filtersUploadZone').style.display = 'none';
    $('filtersEditor').style.display = 'block';
    initFiltersCanvas(img);
  });
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentFilter = btn.dataset.filter;
      applyFilter(state.currentFilter);
    });
  });
  $('filtersDownloadBtn').addEventListener('click', () => downloadCanvas($('filtersCanvas'), 'filtered-image'));
}

function initFiltersCanvas(img) {
  const canvas = $('filtersCanvas');
  const maxW = Math.min(window.innerWidth - 40, 700);
  const scale = Math.min(maxW / img.width, 1);
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  state.filtersScale = scale;
  state.filtersImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function applyFilter(filterName) {
  const canvas = $('filtersCanvas');
  const ctx = canvas.getContext('2d');
  if (!state.filtersImageData) return;
  ctx.putImageData(state.filtersImageData, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  switch (filterName) {
    case 'normal': break;
    case 'grayscale':
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i + 1] = data[i + 2] = avg;
      }
      break;
    case 'sepia':
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
      }
      break;
    case 'invert':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
      break;
    case 'brightness':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] + 40);
        data[i + 1] = Math.min(255, data[i + 1] + 40);
        data[i + 2] = Math.min(255, data[i + 2] + 40);
      }
      break;
    case 'contrast':
      const factor = 1.5;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, ((data[i] / 255 - 0.5) * factor + 0.5) * 255);
        data[i + 1] = Math.min(255, ((data[i + 1] / 255 - 0.5) * factor + 0.5) * 255);
        data[i + 2] = Math.min(255, ((data[i + 2] / 255 - 0.5) * factor + 0.5) * 255);
      }
      break;
    case 'blur':
      ctx.filter = 'blur(4px)';
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';
      return;
    case 'sharpen':
      ctx.filter = 'contrast(1.5) brightness(0.9)';
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';
      return;
    case 'vintage':
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        data[i] = Math.min(255, r * 1.1);
        data[i + 1] = Math.min(255, g * 0.9);
        data[i + 2] = Math.min(255, b * 0.7);
      }
      break;
    case 'cool':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.max(0, data[i] - 20);
        data[i + 2] = Math.min(255, data[i + 2] + 30);
      }
      break;
    case 'warm':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] + 30);
        data[i + 2] = Math.max(0, data[i + 2] - 20);
      }
      break;
  }
  ctx.putImageData(imageData, 0, 0);
}

// ---------- PIXEL ART TOOL ----------
function initPixelArt() {
  if ($('pixelCanvas').dataset.initialized) return;
  $('pixelCanvas').dataset.initialized = 'true';
  const size = state.pixelSize;
  state.pixelGrid = Array(size).fill().map(() => Array(size).fill('#000000'));
  renderPixelGrid();
  setupPixelControls();
}

function renderPixelGrid() {
  const canvas = $('pixelCanvas');
  const size = state.pixelSize;
  const cellSize = Math.min(Math.floor((Math.min(window.innerWidth - 40, 500)) / size), 20);
  canvas.width = size * cellSize;
  canvas.height = size * cellSize;
  canvas.style.width = canvas.width + 'px';
  canvas.style.height = canvas.height + 'px';
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      ctx.fillStyle = state.pixelGrid[r][c];
      ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
    }
  }
  state.pixelCellSize = cellSize;
}

function setupPixelControls() {
  $('pixelGridSize').addEventListener('input', () => {
    state.pixelSize = parseInt($('pixelGridSize').value);
    $('pixelGridSizeVal').textContent = state.pixelSize + '×' + state.pixelSize;
    state.pixelGrid = Array(state.pixelSize).fill().map(() => Array(state.pixelSize).fill('#000000'));
    renderPixelGrid();
  });
  $('pixelPencil').addEventListener('click', () => { state.pixelTool = 'draw'; highlightPixelTool('pixelPencil'); });
  $('pixelEraser').addEventListener('click', () => { state.pixelTool = 'erase'; highlightPixelTool('pixelEraser'); });
  $('pixelFill').addEventListener('click', () => {
    for (let r = 0; r < state.pixelSize; r++)
      for (let c = 0; c < state.pixelSize; c++)
        state.pixelGrid[r][c] = state.pixelColor;
    renderPixelGrid();
  });
  $('pixelColor').addEventListener('input', e => { state.pixelColor = e.target.value; });
  $('pixelClearBtn').addEventListener('click', () => {
    state.pixelGrid = Array(state.pixelSize).fill().map(() => Array(state.pixelSize).fill('#000000'));
    renderPixelGrid();
  });
  $('pixelExportBtn').addEventListener('click', () => {
    const canvas = $('pixelCanvas');
    canvas.toBlob(blob => downloadBlob(blob, 'pixel-art'));
  });

  const canvas = $('pixelCanvas');
  const getPos = e => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const col = Math.floor((clientX - rect.left) / state.pixelCellSize);
    const row = Math.floor((clientY - rect.top) / state.pixelCellSize);
    return { row, col };
  };

  const drawPixel = (row, col) => {
    if (row < 0 || row >= state.pixelSize || col < 0 || col >= state.pixelSize) return;
    state.pixelGrid[row][col] = state.pixelTool === 'erase' ? '#000000' : state.pixelColor;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = state.pixelGrid[row][col];
    ctx.fillRect(col * state.pixelCellSize, row * state.pixelCellSize, state.pixelCellSize, state.pixelCellSize);
  };

  canvas.addEventListener('mousedown', e => {
    state.pixelDrawing = true;
    const { row, col } = getPos(e);
    drawPixel(row, col);
  });
  canvas.addEventListener('mousemove', e => {
    if (!state.pixelDrawing) return;
    const { row, col } = getPos(e);
    drawPixel(row, col);
  });
  canvas.addEventListener('mouseup', () => { state.pixelDrawing = false; });
  canvas.addEventListener('mouseleave', () => { state.pixelDrawing = false; });
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    state.pixelDrawing = true;
    const { row, col } = getPos(e);
    drawPixel(row, col);
  });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!state.pixelDrawing) return;
    const { row, col } = getPos(e);
    drawPixel(row, col);
  });
  canvas.addEventListener('touchend', () => { state.pixelDrawing = false; });
}

function highlightPixelTool(id) {
  document.querySelectorAll('#tool-pixelart .tool-btn').forEach(b => b.classList.remove('active'));
  $(id).classList.add('active');
}

// ---------- DOWNLOAD ----------
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${Date.now()}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ---------- PWA ----------
function setupPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}

// ---------- INIT ----------
function init() {
  setupNavigation();
  setupCompress();
  setupCrop();
  setupResize();
  setupFilters();
  setupPWA();
}

document.addEventListener('DOMContentLoaded', init);