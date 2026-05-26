/**
 * Bulk ZIP Download – Uses JSZip (loaded via CDN) to bundle images into a ZIP.
 */
import { showSpinner, hideSpinner } from '../utils/helpers.js';

export function initBulkZip(container, fileQueue) {
  container.innerHTML = `
    <h2>Bulk ZIP Download</h2>
    <p class="subtitle">Compress all queued images into a single ZIP file</p>
    <div id="bulkFilesList"></div>
    <button class="btn btn-primary" id="createZipBtn" disabled>Create ZIP</button>
  `;

  const listDiv = document.getElementById('bulkFilesList');
  const createBtn = document.getElementById('createZipBtn');

  function updateList() {
    const files = fileQueue.getAll();
    listDiv.innerHTML = files.length ? files.map(f => `<p>📄 ${f.name} (${formatBytes(f.size)})</p>`).join('') : '<p>No files in queue. Use other tools to add images.</p>';
    createBtn.disabled = files.length === 0;
  }

  fileQueue.onChange(updateList);
  updateList();

  createBtn.addEventListener('click', async () => {
    const files = fileQueue.getAll();
    if (!files.length) return;
    showSpinner();
    // Load JSZip from CDN if not already loaded
    if (typeof JSZip === 'undefined') {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    const zip = new JSZip();
    const promises = files.map(file => {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = (e) => {
          zip.file(file.name, e.target.result.split(',')[1], { base64: true });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    });
    await Promise.all(promises);
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pixelpress_images.zip';
    a.click();
    URL.revokeObjectURL(url);
    hideSpinner();
  });
}

function formatBytes(bytes, decimals = 1) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}