pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

let pdfDoc = null;
const pageImages = {}; // Stores base64 data strings for ZIP output

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = $('dropZone');
    const fileInput = $('fileInput');
    const uploadSection = $('uploadSection');
    const workSection = $('workSection');
    const previewGrid = $('previewGrid');
    const statusMessage = $('statusMessage');
    const downloadAllBtn = $('downloadAllBtn');

    dropZone.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files) processPDF(e.target.files);
    });

    // Simple Drag & Drop implementation
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.type === "application/pdf") {
            processPDF(e.dataTransfer.files);
        }
    });

    async function processPDF(file) {
        uploadSection.style.display = 'none';
        workSection.style.display = 'block';
        previewGrid.innerHTML = '';
        
        const fileReader = new FileReader();
        fileReader.onload = async function () {
            const typedarray = new Uint8Array(this.result);
            try {
                pdfDoc = await pdfjsLib.getDocument(typedarray).promise;
                statusMessage.innerText = `Found ${pdfDoc.numPages} pages. Rendering previews...`;
                
                for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                    await renderPage(pageNum);
                }
                
                statusMessage.innerText = "All pages converted successfully!";
                downloadAllBtn.style.display = 'inline-block';
            } catch (err) {
                statusMessage.style.color = '#ef4444';
                statusMessage.innerText = "Error loading PDF file.";
                console.error(err);
            }
        };
        fileReader.readAsArrayBuffer(file);
    }

    async function renderPage(num) {
        const page = await pdfDoc.getPage(num);
        const viewport = page.getViewport({ scale: 1.5 }); // High definition scale
        
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
        
        // Single page individual download action button
        const dlBtn = document.createElement('button');
        dlBtn.className = 'btn';
        dlBtn.style.padding = '6px 12px';
        dlBtn.style.fontSize = '12px';
        dlBtn.style.marginTop = '8px';
        dlBtn.innerText = 'Download';
        card.appendChild(dlBtn);
        
        previewGrid.appendChild(card);

        const renderContext = { canvasContext: ctx, viewport: viewport };
        await page.render(renderContext).promise;
        
        // Save base64 standard string format
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pageImages[num] = imgData;

        dlBtn.addEventListener('click', () => {
            const a = document.createElement('a');
            a.href = imgData;
            a.download = `page-${num}.jpg`;
            a.click();
        });
    }

    // Creates batch collection down as ZIP archive
    downloadAllBtn.addEventListener('click', async () => {
        const zip = new JSZip();
        for (const [num, data] of Object.entries(pageImages)) {
            const base64Data = data.replace(/^data:image\/jpeg;base64,/, "");
            zip.file(`page-${num}.jpg`, base64Data, { base64: true });
        }
        const content = await zip.generateAsync({ type: "blob" });
        downloadBlob(content, "pixelpress-pdf-pages.zip");
    });
});
