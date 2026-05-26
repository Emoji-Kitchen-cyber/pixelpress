import { showSpinner, hideSpinner } from '../utils/helpers.js';

export function initBulkZip(container, fileQueue) {
  container.innerHTML = `
    <h2>Bulk ZIP Download</h2><p class="subtitle">Compress all queued images into a single ZIP file</p>
    <div id="bulkFilesList"></div><button class="btn btn-primary" id="createZipBtn" disabled>Create ZIP</button>
  `;
  const listDiv = container.querySelector('#bulkFilesList');
  const createBtn = container.querySelector('#createZipBtn');
  function updateList() { const files = fileQueue.getAll(); listDiv.innerHTML = files.length ? files.map(f => `<p>📄 ${f.name} (${formatBytes(f.size)})</p>`).join('') : '<p>No files in queue. Use other tools to add images.</p>'; createBtn.disabled = files.length === 0; }
  fileQueue.onChange(updateList); updateList();
  createBtn.addEventListener('click', async () => {
    const files = fileQueue.getAll(); if (!files.length) return; showSpinner();
    if (typeof JSZip === 'undefined') { await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
    const zip = new JSZip(); await Promise.all(files.map(f => new Promise(res => { const r = new FileReader(); r.onload = e => { zip.file(f.name, e.target.result.split(',')[1], {base64: true}); res(); }; r.readAsDataURL(f); })));
    const content = await zip.generateAsync({type: 'blob'}); const url = URL.createObjectURL(content); const a = document.createElement('a'); a.href = url; a.download = 'pixelpress_images.zip'; a.click(); URL.revokeObjectURL(url); hideSpinner();
  });
}
function formatBytes(b, d=1) { if (!b) return '0 Bytes'; const k=1024, s=['Bytes','KB','MB','GB']; const i=Math.floor(Math.log(b)/Math.log(k)); return parseFloat((b/Math.pow(k,i)).toFixed(d))+' '+s[i]; }