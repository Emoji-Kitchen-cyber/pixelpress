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

    dropZone.addEventListener('dragover', (e) => { 
        e.preventDefault(); 
        dropZone.style.borderColor = '#ec4899';
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    });

    function handleFiles(files) {
        if(files.length === 0) return;
        workSection.style.display = 'block';

        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function() {
                    selectedImages.push({ src: e.target.result, name: file.name, w: img.width, h: img.height });
                    
                    const wrap = document.createElement('div');
                    wrap.className = 'thumb-wrapper';
                    wrap.innerHTML = `<img src="${e.target.result}" style="width:100px;height:100px;object-fit:cover;border-radius:10px;"><br><span style="font-size:11px;">${file.name}</span>`;
                    previewContainer.appendChild(wrap);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    generatePdfBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (selectedImages.length === 0) return;

        generatePdfBtn.innerText = "Processing Data...";
        generatePdfBtn.disabled = true;

        // Dynamic jsPDF direct invocation without print screen
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'px', 'a4');
        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = pdf.internal.pageSize.getHeight();

        selectedImages.forEach((imgData, index) => {
            if (index > 0) pdf.addPage();
            
            let ratio = imgData.w / imgData.h;
            let finalW = pdfW - 40; 
            let finalH = finalW / ratio;

            if (finalH > (pdfH - 40)) {
                finalH = pdfH - 40;
                finalW = finalH * ratio;
            }

            const x = (pdfW - finalW) / 2;
            const y = (pdfH - finalH) / 2;

            pdf.addImage(imgData.src, 'JPEG', x, y, finalW, finalH, undefined, 'FAST');
        });

        pdf.save('pixelpress-document.pdf');
        generatePdfBtn.innerText = "⚡ Generate PDF Document";
        generatePdfBtn.disabled = false;
    });
});


