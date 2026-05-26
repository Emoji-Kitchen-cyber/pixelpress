// Hardware Accelerated Sequential Queue PDF to JPG Engine
let pdfDoc = null;
let pageImages = {};

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadSection = document.getElementById('uploadSection');
    const workSection = document.getElementById('workSection');
    const previewGrid = document.getElementById('previewGrid');
    const statusMessage = document.getElementById('statusMessage');
    const downloadAllBtn = document.getElementById('downloadAllBtn');

    if (!dropZone || !fileInput) return;

    // Standard script hook fallback setup
    const pdfjs = window['pdfjs-dist/build/pdf'] || window.pdfjsLib;
    if (pdfjs) {
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    }

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files) processPDF(e.target.files);
    });

    dropZone.addEventListener('dragover', (e) => e.preventDefault());
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files) processPDF(e.dataTransfer.files);
    });

    async function processPDF(file) {
        uploadSection.style.display = 'none';
        workSection.style.display = 'block';
        previewGrid.innerHTML = '';
        statusMessage.innerText = "Reading file streams securely...";
        
        const fileReader = new FileReader();
        fileReader.onload = async function () {
            const typedarray = new Uint8Array(this.result);
            try {
                const loadingTask = pdfjs.getDocument({ 
                    data: typedarray,
                    stopAtErrors: false,
                    isEvalSupported: false 
                });
                
                pdfDoc = await loadingTask.promise;
                const totalPages = pdfDoc.numPages;
                pageImages = {}; // Reset container data
                
                // Processing single queue logic to avoid main thread crashes
                for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                    statusMessage.innerText = `Converting page ${pageNum} of ${totalPages}...`;
                    await renderPageControlled(pageNum);
                    
                    // Crucial: 1ms hardware yielding break to refresh browser CPU
                    await new Promise(resolve => setTimeout(resolve, 1));
                }
                
                statusMessage.innerText = "⚡ Success! All pages converted.";
                if (typeof JSZip !== 'undefined') {
                    downloadAllBtn.style.display = 'inline-block';
                }
            } catch (err) {
                statusMessage.style.color = '#ef4444';
                statusMessage.innerText = "Error reading PDF file data structure.";
                console.error(err);
            }
        };
        fileReader.readAsArrayBuffer(file);
    }

    async function renderPageControlled(num) {
        const page = await pdfDoc.getPage(num);
        
        // Highly optimized standard viewport logic for instant processing
        const viewport = page.getViewport({ scale: 1.0 }); 
        
        const card = document.createElement('div');
        card.className = 'page-card';
        
        const canvas = document.createElement('canvas');
        // Turning off transparency checks for pure 60fps canvas performance
        const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true }); 
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        card.appendChild(canvas);
        const label = document.createElement('p');
        label.innerText = `Page ${num}`;
        card.appendChild(label);
        
        const dlBtn = document.createElement('button');
        dlBtn.className = 'btn';
        dlBtn.style = 'padding:6px 12px; font-size:12px; margin-top:8px;';
        dlBtn.innerText = 'Download';
        card.appendChild(dlBtn);
        
        previewGrid.appendChild(card);

        // Hardware layer pass execution
        await page.render({ 
            canvasContext: ctx, 
            viewport: viewport,
            intent: 'print'
        }).promise;
        
        // Optimized compression matching point
        const imgData = canvas.toDataURL('image/jpeg', 0.75);
        pageImages[num] = imgData;

        dlBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const a = document.createElement('a');
            a.href = imgData;
            a.download = `page-${num}.jpg`;
            a.click();
        });
    }

    downloadAllBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        downloadAllBtn.innerText = "Zipping Instantly...";
        const zip = new JSZip();
        
        for (const [num, data] of Object.entries(pageImages)) {
            const base64Data = data.split(',');
            zip.file(`page-${num}.jpg`, base64Data, { base64: true });
        }
        
        // Zero delay dynamic packet assignment
        const content = await zip.generateAsync({ type: "blob", compression: "STORE" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "pixelpress-images-bundle.zip";
        link.click();
        downloadAllBtn.innerText = "📥 Download All Pages (ZIP)";
    });
});




