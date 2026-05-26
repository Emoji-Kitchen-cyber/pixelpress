let selectedImages = [];

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = $('dropZone');
    const fileInput = $('fileInput');
    const workSection = $('workSection');
    const previewContainer = $('previewContainer');
    const generatePdfBtn = $('generatePdfBtn');

    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
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
                    selectedImages.push({ src: e.target.result, width: img.width, height: img.height, name: file.name });
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

    generatePdfBtn.addEventListener('click', () => {
        if (selectedImages.length === 0) return;

        const { jsPDF } = window.jspdf;
        // Basic configuration fallback context
        const pdf = new jsPDF('p', 'px', 'a4');
        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = pdf.internal.pageSize.getHeight();

        selectedImages.forEach((imgData, index) => {
            if (index > 0) pdf.addPage();
            
            // Scaled dynamic rendering ratio calculation
            let ratio = imgData.width / imgData.height;
            let finalW = pdfW - 40; // 20px padding left-right
            let finalH = finalW / ratio;

            if (finalH > (pdfH - 40)) {
                finalH = pdfH - 40;
                finalW = finalH * ratio;
            }

            const xCentering = (pdfW - finalW) / 2;
            const yCentering = (pdfH - finalH) / 2;

            // Secure format insertion context
            pdf.addImage(imgData.src, 'JPEG', xCentering, yCentering, finalW, finalH);
        });

        pdf.save('pixelpress-converted-document.pdf');
    });
});
