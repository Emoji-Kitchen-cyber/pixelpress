/**
 * PixelPress – Utility Helpers
 * Provides drag-and-drop setup, formatting, spinner control, and URL cleanup.
 */

// Show/hide global spinner
export function showSpinner() {
  const spinner = document.getElementById('globalSpinner');
  if (spinner) spinner.style.display = 'flex';
}

export function hideSpinner() {
  const spinner = document.getElementById('globalSpinner');
  if (spinner) spinner.style.display = 'none';
}

// Format bytes to human-readable
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Revoke multiple object URLs (memory cleanup)
export function revokeURLs(urls) {
  if (!Array.isArray(urls)) urls = [urls];
  urls.forEach(url => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
}

/**
 * Setup drag & drop + click on a dropZone element.
 * @param {HTMLElement} dropZone 
 * @param {HTMLInputElement} fileInput 
 * @param {Function} onFilesSelected - receives FileList
 */
export function setupDragDrop(dropZone, fileInput, onFilesSelected) {
  // Click to open file dialog
  dropZone.addEventListener('click', () => fileInput.click());

  // File input change
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) onFilesSelected(e.target.files);
  });

  // Drag & drop events
  ['dragenter', 'dragover'].forEach(evt => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(evt => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt.files.length) {
      onFilesSelected(dt.files);
    }
  });
}