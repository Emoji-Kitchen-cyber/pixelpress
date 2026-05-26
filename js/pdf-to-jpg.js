let pdfDoc = null;
const pageImages = {}; 

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
        statusMessage.innerText = "Processing document arrays...";
        
        const fileReader = new FileReader();
        fileReader.onload = async function () {
            const typedarray = new Uint8Array(this.result);
            try {
                const loadingTask = pdfjs.getDocument({ data: typedarray });
                pdfDoc = await loadingTask.promise;
                statusMessage.innerText = `Converting ${pdfDoc.numPages} pages...`;
                
                // Pure linear loop with fast rendering scale
                for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                    await renderPage(pageNum);
                }
                
                statusMessage.innerText = "Done!";
                if (typeof JSZip !== 'undefined') {
                    downloadAllBtn.style.display = 'inline-block';
                }
            } catch (err) {
                statusMessage.innerText = "Conversion error.";
                console.error(err);
            }
        };
        fileReader.readAsArrayBuffer(file);
    }

    async function renderPage(num) {
        const page = await pdfDoc.getPage(num);
        const viewport = page.getViewport({ scale: 1.0 }); // Balanced scale for maximum execution speed
        
        const card = document.createElement('div');
        card.className = 'page-card';
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
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

        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        
        const imgData = canvas.toDataURL('image/jpeg', 0.8);
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
        const zip = new JSZip();
        for (const [num, data] of Object.entries(pageImages)) {
            const base64Data = data.replace(/^data:image\/jpeg;base64,/, "");
            zip.file(`page-${num}.jpg`, base64Data, { base64: true });
        }
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "pixelpress-pdf-images.zip";
        link.click();
    });
});

