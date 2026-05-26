export function showSpinner() { const s = document.getElementById('globalSpinner'); if (s) s.style.display = 'flex'; }
export function hideSpinner() { const s = document.getElementById('globalSpinner'); if (s) s.style.display = 'none'; }
export function formatBytes(bytes, decimals = 1) { if (!bytes || bytes === 0) return '0 Bytes'; const k = 1024; const dm = decimals < 0 ? 0 : decimals; const sizes = ['Bytes', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]; }
export function revokeURLs(urls) { if (!Array.isArray(urls)) urls = [urls]; urls.forEach(url => { if (url && url.startsWith('blob:')) { URL.revokeObjectURL(url); } }); }
export function setupDragDrop(dropZone, fileInput, onFilesSelected) {
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => { if (e.target.files.length) onFilesSelected(e.target.files); });
  ['dragenter', 'dragover'].forEach(evt => dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); }));
  ['dragleave', 'drop'].forEach(evt => dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); }));
  dropZone.addEventListener('drop', (e) => { const dt = e.dataTransfer; if (dt.files.length) onFilesSelected(dt.files); });
}