// High-Speed Parallel PDF to JPG Engine
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
        statusMessage.innerText = "Loading PDF securely...";
        
        const fileReader = new FileReader();
        fileReader.onload = async function () {
            const typedarray = new Uint8Array(this.result);
            try {
                const loadingTask = pdfjs.getDocument({ data: typedarray });
                pdfDoc = await loadingTask.promise;
                statusMessage.innerText = `Converting ${pdfDoc.numPages} pages in parallel threads...`;
                
                // Create a list of parallel promises to boost rendering speed
                const renderPromises = [];
                for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                    renderPromises.push(renderPage(pageNum));
                }
                
                // Execute all pages together at once
                await Promise.all(renderPromises);
                
                statusMessage.innerText = "Finished instantly!";
                if (typeof JSZip !== 'undefined') {
                    downloadAllBtn.style.display = 'inline-block';
                }
            } catch (err) {
                statusMessage.innerText = "Error parsing file.";
                console.error(err);
            }
        };
        fileReader.readAsArrayBuffer(file);
    }

    async function renderPage(num) {
        const page = await pdfDoc.getPage(num);
        const viewport = page.getViewport({ scale: 1.2 }); // Balanced scale for ultra-fast conversion
        
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
        dlBtn.style = 'padding:6px 12px; font-size:12px; margin-top:8px;';
        dlBtn.innerText = 'Download';
        card.appendChild(dlBtn);
        
        previewGrid.appendChild(card);

        // Render to canvas asynchronously
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        
        // Optimize image quality ratio for speed
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
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
        downloadAllBtn.innerText = "Zipping files...";
        const zip = new JSZip();
        for (const [num, data] of Object.entries(pageImages)) {
            const base64Data = data.replace(/^data:image\/jpeg;base64,/, "");
            zip.file(`page-${num}.jpg`, base64Data, { base64: true });
        }
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "pixelpress-images.zip";
        link.click();
        downloadAllBtn.innerText = "📥 Download All Pages (ZIP)";
    });
});

