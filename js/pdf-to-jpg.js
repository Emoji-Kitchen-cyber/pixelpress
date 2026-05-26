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

    // CRITICAL FIX: Library handler mapping without using external server worker threads
    const pdfjsLib = window['pdfjs-dist/build/pdf'] || window.pdfjsLib;
    if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = ''; // Disabling worker to force standard sync rendering
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

    function processPDF(file) {
        uploadSection.style.display = 'none';
        workSection.style.display = 'block';
        previewGrid.innerHTML = '';
        statusMessage.innerText = "Extracting pages... Please wait.";
        
        const fileReader = new FileReader();
        fileReader.onload = function () {
            const typedarray = new Uint8Array(this.result);
            
            // Forcing inline synchronous execution model pass
            pdfjsLib.getDocument({ data: typedarray }).promise.then((pdf) => {
                pdfDoc = pdf;
                const totalPages = pdf.numPages;
                pageImages = {}; 
                
                statusMessage.innerText = `Found ${totalPages} pages. Rendering previews...`;
                
                // Synchronous serial chain execution to bypass freezes
                let sequence = Promise.resolve();
                for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                    sequence = sequence.then(() => renderPageSingle(pageNum));
                }
                
                sequence.then(() => {
                    statusMessage.innerText = "⚡ All pages extracted successfully!";
                    if (typeof JSZip !== 'undefined') {
                        downloadAllBtn.style.display = 'inline-block';
                    }
                });

            }).catch((err) => {
                statusMessage.style.color = '#ef4444';
                statusMessage.innerText = "Error parsing file format.";
                console.error(err);
            });
        };
        fileReader.readAsArrayBuffer(file);
    }

    function renderPageSingle(num) {
        return pdfDoc.getPage(num).then((page) => {
            const viewport = page.getViewport({ scale: 1.0 }); // Clean speed execution standard scale
            
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

            return page.render({ canvasContext: ctx, viewport: viewport }).promise.then(() => {
                const imgData = canvas.toDataURL('image/jpeg', 0.80);
                pageImages[num] = imgData;

                dlBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const a = document.createElement('a');
                    a.href = imgData;
                    a.download = `page-${num}.jpg`;
                    a.click();
                });
            });
        });
    }

    downloadAllBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        downloadAllBtn.innerText = "Creating ZIP...";
        const zip = new JSZip();
        
        for (const [num, data] of Object.entries(pageImages)) {
            const base64Data = data.split(',');
            zip.file(`page-${num}.jpg`, base64Data, { base64: true });
        }
        
        const content = await zip.generateAsync({ type: "blob", compression: "STORE" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "pixelpress-bundle.zip";
        link.click();
        downloadAllBtn.innerText = "📥 Download All Pages (ZIP)";
    });
});
