// Variable settings for image state
let originalImg = null;
let currentRotation = 0; // 0, 90, 180, 270
let isFlipH = false;
let isFlipV = false;
let zoomScale = 1.0;

// Filter States
const filters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  grayscale: 0,
  sepia: 0,
  blur: 0
};

// DOM Elements
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const uploadSection = document.getElementById('uploadSection');
const editorSection = document.getElementById('editorSection');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Sliders
const brightnessSlider = document.getElementById('brightness');
const contrastSlider = document.getElementById('contrast');
const saturationSlider = document.getElementById('saturation');

// --- 1. Upload Logic ---
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.style.borderColor = '#ec4899';
  dropZone.style.background = '#fdf4ff';
});

dropZone.addEventListener('dragleave', () => {
  dropZone.style.borderColor = '#94a3b8';
  dropZone.style.background = 'transparent';
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    loadImage(file);
  }
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) loadImage(file);
});

function loadImage(file) {
  const reader = new FileReader();
  reader.onload = function(event) {
    originalImg = new Image();
    originalImg.onload = function() {
      // Hide upload zone and show editor
      uploadSection.style.display = 'none';
      editorSection.style.display = 'block';
      
      // Reset states
      resetToDefault();
    };
    originalImg.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

// --- 2. Canvas Rendering Engine (Handles everything dynamically) ---
function applyEdits() {
  if (!originalImg) return;

  // Determine standard size based on rotation
  const is90or270 = currentRotation === 90 || currentRotation === 270;
  const targetWidth = (is90or270 ? originalImg.height : originalImg.width) * zoomScale;
  const targetHeight = (is90or270 ? originalImg.width : originalImg.height) * zoomScale;

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();

  // Apply CSS-like Filters directly on Canvas Context
  ctx.filter = `
    brightness(${filters.brightness}%)
    contrast(${filters.contrast}%)
    saturate(${filters.saturation}%)
    grayscale(${filters.grayscale}%)
    sepia(${filters.sepia}%)
    blur(${filters.blur}px)
  `;

  // Move origin to center for rotation and scaling
  ctx.translate(canvas.width / 2, canvas.height / 2);

  // Apply Rotations
  ctx.rotate((currentRotation * Math.PI) / 180);

  // Apply Flips
  const scaleX = isFlipH ? -1 : 1;
  const scaleY = isFlipV ? -1 : 1;
  ctx.scale(scaleX, scaleY);

  // Draw the image centered
  ctx.drawImage(
    originalImg, 
    -originalImg.width * zoomScale / 2, 
    -originalImg.height * zoomScale / 2, 
    originalImg.width * zoomScale, 
    originalImg.height * zoomScale
  );

  ctx.restore();
}

// --- 3. Event Listeners for Filters ---
brightnessSlider.addEventListener('input', (e) => {
  filters.brightness = e.target.value;
  applyEdits();
});

contrastSlider.addEventListener('input', (e) => {
  filters.contrast = e.target.value;
  applyEdits();
});

saturationSlider.addEventListener('input', (e) => {
  filters.saturation = e.target.value;
  applyEdits();
});

// One-click Effects Buttons
document.getElementById('grayscaleBtn').addEventListener('click', () => {
  filters.grayscale = filters.grayscale === 100 ? 0 : 100;
  applyEdits();
});

document.getElementById('sepiaBtn').addEventListener('click', () => {
  filters.sepia = filters.sepia === 100 ? 0 : 100;
  applyEdits();
});

document.getElementById('blurBtn').addEventListener('click', () => {
  filters.blur = filters.blur === 5 ? 0 : 5; // Toggles 5px blur
  applyEdits();
});

// --- 4. Transformations (Rotate, Flip, Zoom) ---
document.getElementById('rotateLeft').addEventListener('click', () => {
  currentRotation = (currentRotation - 90 + 360) % 360;
  applyEdits();
});

document.getElementById('rotateRight').addEventListener('click', () => {
  currentRotation = (currentRotation + 90) % 360;
  applyEdits();
});

document.getElementById('flipH').addEventListener('click', () => {
  isFlipH = !isFlipH;
  applyEdits();
});

document.getElementById('flipV').addEventListener('click', () => {
  isFlipV = !isFlipV;
  applyEdits();
});

document.getElementById('zoomInBtn').addEventListener('click', () => {
  if (zoomScale < 3.0) {
    zoomScale += 0.1;
    applyEdits();
  }
});

document.getElementById('zoomOutBtn').addEventListener('click', () => {
  if (zoomScale > 0.3) {
    zoomScale -= 0.1;
    applyEdits();
  }
});

// --- 5. Reset & Download ---
function resetToDefault() {
  currentRotation = 0;
  isFlipH = false;
  isFlipV = false;
  zoomScale = 1.0;
  
  filters.brightness = 100;
  filters.contrast = 100;
  filters.saturation = 100;
  filters.grayscale = 0;
  filters.sepia = 0;
  filters.blur = 0;

  // Sync back to sliders
  brightnessSlider.value = 100;
  contrastSlider.value = 100;
  saturationSlider.value = 100;

  applyEdits();
}

document.getElementById('resetBtn').addEventListener('click', resetToDefault);

document.getElementById('downloadBtn').addEventListener('click', () => {
  if (!originalImg) return;
  
  // Create a temporary anchor element to trigger high quality download
  const link = document.createElement('a');
  link.download = 'pixelpress-edited-photo.png';
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
});
