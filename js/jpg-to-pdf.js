// Ultra-Fast Blob-based JPG to PDF Engine
let selectedImages = [];

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const workSection = document.getElementById('workSection');
    const previewContainer = document.getElementById('previewContainer');
    const generatePdfBtn = document.getElementById('generatePdfBtn');

    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    dropZone.addEventListener('dragover', (e) => e.preventDefault());
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    });

    function handleFiles(files) {
        if(files.length === 0) return;
        workSection.style.display = 'block';

        // Read files instantly using Object URLs instead of slow Base64
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            
            const blobUrl = URL.createObjectURL(file);
            const img = new Image();
            img.onload = function() {
                selectedImages.push({ src: blobUrl, file: file, w: img.width, h: img.height });
                
                const wrap = document.createElement('div');
                wrap.className = 'thumb-wrapper';
                wrap.innerHTML = `<img src="${blobUrl}" style="width:100px;height:100px;object-fit:cover;border-radius:10px;"><br><span style="font-size:11px;">${file.name}</span>`;
                previewContainer.appendChild(wrap);
            };
            img.src = blobUrl;
        });
    }

    generatePdfBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (selectedImages.length === 0) return;

        generatePdfBtn.innerText = "Fast Converting...";
        generatePdfBtn.disabled = true;

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'px', 'a4');
        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = pdf.internal.pageSize.getHeight();

        // Optimized execution loop using internal image arrays
        for(let index = 0; index < selectedImages.length; index++) {
            if (index > 0) pdf.addPage();
            
            const imgData = selectedImages[index];
            let ratio = imgData.w / imgData.h;
            let finalW = pdfW - 20; 
            let finalH = finalW / ratio;

            if (finalH > (pdfH - 20)) {
                finalH = pdfH - 20;
                finalW = finalH * ratio;
            }

            const x = (pdfW - finalW) / 2;
            const y = (pdfH - finalH) / 2;

            // Using standard compression for lightning fast generation
            pdf.addImage(imgData.src, 'JPEG', x, y, finalW, finalH, undefined, 'FAST');
        }

        pdf.save('pixelpress-fast-document.pdf');
        generatePdfBtn.innerText = "⚡ Generate PDF Document";
        generatePdfBtn.disabled = false;
    });
});


