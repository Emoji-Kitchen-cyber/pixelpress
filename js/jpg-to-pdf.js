// Native JPG to PDF Converter Engine (No External Libraries)
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

        // Create a standalone printing window to bypass complex library blocks
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>PixelPress PDF Document</title>
                <style>
                    body { margin: 0; padding: 0; background: white; text-align: center; }
                    .page { page-break-after: always; display: flex; align-items: center; justify-content: center; height: 100vh; box-sizing: border-box; padding: 20px; }
                    img { max-width: 100%; max-height: 100%; object-fit: contain; }
                    @page { size: auto; margin: 0mm; }
                    @media print { body { -webkit-print-color-adjust: exact; } }
                </style>
            </head>
            <body>
                ${selectedImages.map(img => `<div class="page"><img src="${img.src}"></div>`).join('')}
                <script>
                    window.onload = function() {
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    };
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
    });
});

