// Common functions for all tool pages

// Helper to get element by ID
const $ = id => document.getElementById(id);

// Setup drag & drop upload on a zone
function setupUpload(zoneId, inputId, onFileReady) {
  const zone = $(zoneId);
  const input = $(inputId);
  if (!zone || !input) return;

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadImageFile(file, onFileReady);
  });
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (file) loadImageFile(file, onFileReady);
  });
}

function loadImageFile(file, callback) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => callback(img, file);
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

// Download a blob as file
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// Show processing spinner
function showProcessing(containerId) {
  const el = $(containerId);
  if (el) el.style.display = 'block';
}
function hideProcessing(containerId) {
  const el = $(containerId);
  if (el) el.style.display = 'none';
}

// Global error logger for monitoring (development & debugging)
window.onerror = function(msg, url, line) {
  console.error('Global error:', msg, 'at', url, 'line', line);
  // Optional: send error to a logging service in the future
};