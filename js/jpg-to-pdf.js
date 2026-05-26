// Optimized Super-Fast JPG to PDF Engine
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

        // Parallel processing optimized for speed
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function() {
                    selectedImages.push({ src: e.target.result, name: file.name });
                    
                    // Fast UI Render
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

        generatePdfBtn.innerText = "Generating PDF...";
        generatePdfBtn.disabled = true;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <style>
                    body { margin: 0; padding: 0; background: white; }
                    .page { page-break-after: always; display: flex; align-items: center; justify-content: center; height: 100vh; }
                    img { max-width: 100%; max-height: 100%; object-fit: contain; }
                    @page { size: auto; margin: 0mm; }
                </style>
            </head>
            <body>
                ${selectedImages.map(img => `<div class="page"><img src="${img.src}"></div>`).join('')}
                <script>
                    window.onload = function() {
                        window.print();
                        window.close();
                    };
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
        
        generatePdfBtn.innerText = "⚡ Generate PDF Document";
        generatePdfBtn.disabled = false;
    });
});

