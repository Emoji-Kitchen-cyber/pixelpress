// JPG to PDF Converter Logic
let selectedImages = [];

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const workSection = document.getElementById('workSection');
    const previewContainer = document.getElementById('previewContainer');
    const generatePdfBtn = document.getElementById('generatePdfBtn');

    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    dropZone.addEventListener('dragover', (e) => { 
        e.preventDefault(); 
        dropZone.style.borderColor = '#ec4899';
        dropZone.style.background = '#fdf4ff';
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#94a3b8';
        dropZone.style.background = 'transparent';
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#94a3b8';
        dropZone.style.background = 'transparent';
        handleFiles(e.dataTransfer.files);
    });

    function handleFiles(files) {
        if(files.length === 0) return;
        workSection.style.display = 'block';

        for (let file of files) {
            if (!file.type.startsWith('image/')) continue;
            
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function() {
                    selectedImages.push({ 
                        src: e.target.result, 
                        width: img.width, 
                        height: img.height, 
                        name: file.name 
                    });
                    renderThumbs();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    function renderThumbs() {
        previewContainer.innerHTML = '';
        selectedImages.forEach(imgData => {
            const wrap = document.createElement('div');
            wrap.className = 'thumb-wrapper';
            const img = document.createElement('img');
            img.src = imgData.src;
            const text = document.createElement('span');
            text.innerText = imgData.name;
            
            wrap.appendChild(img);
            wrap.appendChild(text);
            previewContainer.appendChild(wrap);
        });
    }

    generatePdfBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (selectedImages.length === 0) return;

        const { jsPDF } = window.jspdf;
        // Initialization configuration
        const pdf = new jsPDF('p', 'px', 'a4');
        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = pdf.internal.pageSize.getHeight();

        selectedImages.forEach((imgData, index) => {
            if (index > 0) pdf.addPage();
            
            let ratio = imgData.width / imgData.height;
            let finalW = pdfW - 40; 
            let finalH = finalW / ratio;

            if (finalH > (pdfH - 40)) {
                finalH = pdfH - 40;
                finalW = finalH * ratio;
            }

            const xCentering = (pdfW - finalW) / 2;
            const yCentering = (pdfH - finalH) / 2;

            pdf.addImage(imgData.src, 'JPEG', xCentering, yCentering, finalW, finalH);
        });

        pdf.save('pixelpress-images-document.pdf');
    });
});

