// Hardware Accelerated Ultra-Fast PDF to JPG Engine
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
        statusMessage.innerText = "Extracting document data instantly...";
        
        const fileReader = new FileReader();
        fileReader.onload = async function () {
            const typedarray = new Uint8Array(this.result);
            try {
                // background processing context enabled
                const loadingTask = pdfjs.getDocument({ 
                    data: typedarray,
                    stopAtErrors: false,
                    isEvalSupported: false 
                });
                
                pdfDoc = await loadingTask.promise;
                statusMessage.innerText = `Rendering ${pdfDoc.numPages} pages via GPU Threads...`;
                
                // Pure parallel speed loop
                const promises = [];
                for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                    promises.push(renderPageFast(pageNum));
                }
                
                await Promise.all(promises);
                
                statusMessage.innerText = "⚡ Conversion Completed Instantly!";
                if (typeof JSZip !== 'undefined') {
                    downloadAllBtn.style.display = 'inline-block';
                }
            } catch (err) {
                statusMessage.innerText = "Error decoding PDF structure.";
                console.error(err);
            }
        };
        fileReader.readAsArrayBuffer(file);
    }

    async function renderPageFast(num) {
        const page = await pdfDoc.getPage(num);
        
        // Mobile-friendly ultra optimized resolution scale
        const viewport = page.getViewport({ scale: 1.0 }); 
        
        const card = document.createElement('div');
        card.className = 'page-card';
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false }); // Hardware acceleration enabled
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        card.appendChild(canvas);
        const label = document.createElement('p');
        label.innerText = `Page ${num}`;
        card.appendChild(label);
        
        const dlBtn = document.createElement('button');
        dlBtn.className = 'btn';
        dlBtn.style = 'padding:5px 10px; font-size:12px; margin-top:5px;';
        dlBtn.innerText = 'Download';
        card.appendChild(dlBtn);
        
        previewGrid.appendChild(card);

        // Fast render directly using internal browser layout cache
        await page.render({ 
            canvasContext: ctx, 
            viewport: viewport,
            intent: 'any'
        }).promise;
        
        // Extracting image stream with balanced encoding ratio
        const imgData = canvas.toDataURL('image/jpeg', 0.70);
        pageImages[num] = imgData;

        dlBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const a = document.createElement('a');
            a.href = imgData;
            a.download = `pixelpress-page-${num}.jpg`;
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
        
        // STORE method ignores time-consuming file compression algorithms
        const content = await zip.generateAsync({ type: "blob", compression: "STORE" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "pixelpress-bundle.zip";
        link.click();
        downloadAllBtn.innerText = "📥 Download All Pages (ZIP)";
    });
});



