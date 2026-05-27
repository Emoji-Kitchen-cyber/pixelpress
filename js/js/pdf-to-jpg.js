// pdf-to-jpg.js — Modern, high-performance PDF to JPG converter
// Place this file inside your 'js' folder (js/pdf-to-jpg.js)

(function() {
  'use strict';

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    // ── DOM elements ─────────────────
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadSection = document.getElementById('uploadSection');
    const workSection = document.getElementById('workSection');
    const previewGrid = document.getElementById('previewGrid');
    const statusMessage = document.getElementById('statusMessage');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const qualitySelect = document.getElementById('qualitySelect');

    // ── State ────────────────────────
    let pdfDoc = null;
    let pageImages = {};          // { pageNum: dataURL }
    let renderedCanvases = {};    // { pageNum: { canvas, downloadBtn } }

    // Set PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    // ── Event listeners ─────────────
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length) {
        processPDF(e.target.files[0]);
      }
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files.length) {
        processPDF(e.dataTransfer.files[0]);
      }
    });

    downloadAllBtn.addEventListener('click', downloadAllAsZip);

    // ── PDF Processing (parallel) ────
    async function processPDF(file) {
      // Reset
      pdfDoc = null;
      pageImages = {};
      renderedCanvases = {};
      previewGrid.innerHTML = '';

      uploadSection.style.display = 'none';
      workSection.classList.add('active');
      setStatus('Extracting document…', 'loading');

      try {
        const arrayBuffer = await file.arrayBuffer();
        pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdfDoc.numPages;

        setStatus(`Rendering ${totalPages} pages…`, 'loading');

        // Create card placeholders
        for (let i = 1; i <= totalPages; i++) {
          createPageCard(i);
        }

        // Render in parallel chunks (4 at a time)
        const concurrency = 4;
        const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
        for (let i = 0; i < pages.length; i += concurrency) {
          const chunk = pages.slice(i, i + concurrency);
          await Promise.all(chunk.map(pageNum => renderPage(pageNum)));
        }

        setStatus(`✅ All ${totalPages} pages extracted`, 'success');
        downloadAllBtn.style.display = 'inline-flex';

      } catch (err) {
        console.error(err);
        setStatus('Failed to process PDF. Try another file.', 'error');
      }
    }

    function createPageCard(pageNum) {
      const card = document.createElement('div');
      card.className = 'page-card';
      card.id = `card-${pageNum}`;

      const canvas = document.createElement('canvas');
      canvas.className = 'page-canvas';
      canvas.style.aspectRatio = '3/4';

      const label = document.createElement('div');
      label.className = 'page-label';
      label.textContent = `Page ${pageNum}`;

      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'download-single';
      downloadBtn.textContent = '⬇ Download';
      downloadBtn.disabled = true;

      card.appendChild(canvas);
      card.appendChild(label);
      card.appendChild(downloadBtn);
      previewGrid.appendChild(card);

      renderedCanvases[pageNum] = { canvas, downloadBtn };
    }

    async function renderPage(pageNum) {
      const page = await pdfDoc.getPage(pageNum);
      const quality = parseFloat(qualitySelect.value);
      const viewport = page.getViewport({ scale: 2.0 });

      const { canvas, downloadBtn } = renderedCanvases[pageNum];
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;

      const imgData = canvas.toDataURL('image/jpeg', quality);
      pageImages[pageNum] = imgData;

      downloadBtn.disabled = false;
      downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadSingle(pageNum);
      });

      canvas.style.aspectRatio = '';
    }

    function downloadSingle(pageNum) {
      const dataURL = pageImages[pageNum];
      if (!dataURL) return;
      const a = document.createElement('a');
      a.href = dataURL;
      a.download = `page-${pageNum}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    async function downloadAllAsZip() {
      if (Object.keys(pageImages).length === 0) return;

      downloadAllBtn.disabled = true;
      downloadAllBtn.textContent = '⏳ Creating ZIP…';

      try {
        const zip = new JSZip();
        for (const [num, dataURL] of Object.entries(pageImages)) {
          const base64 = dataURL.split(',')[1];
          zip.file(`page-${num}.jpg`, base64, { base64: true });
        }

        const blob = await zip.generateAsync({
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 }
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pixelpress-pages.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        downloadAllBtn.textContent = '📥 Download All (ZIP)';
      } catch (err) {
        console.error(err);
        setStatus('Failed to create ZIP. Try downloading pages individually.', 'error');
      } finally {
        downloadAllBtn.disabled = false;
      }
    }

    function setStatus(text, type = 'loading') {
      statusMessage.textContent = text;
      statusMessage.className = 'status-badge';
      if (type === 'error') statusMessage.classList.add('error');
      if (type === 'success') statusMessage.classList.add('success');
    }
  }
})();