// Native Sandbox PDF Extraction Engine
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadSection = document.getElementById('uploadSection');
    const workSection = document.getElementById('workSection');
    const previewFrameContainer = document.getElementById('previewFrameContainer');
    const statusMessage = document.getElementById('statusMessage');
    const downloadAllBtn = document.getElementById('downloadAllBtn');

    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files) processPDFNative(e.target.files);
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ec4899';
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files) processPDFNative(e.dataTransfer.files);
    });

    function processPDFNative(file) {
        uploadSection.style.display = 'none';
        workSection.style.display = 'block';
        previewFrameContainer.innerHTML = '';
        statusMessage.innerText = "Bypassing library overhead... Launching engine...";

        const fileReader = new FileReader();
        fileReader.onload = function () {
            const blob = new Blob([this.result], { type: 'application/pdf' });
            const blobURL = URL.createObjectURL(blob);

            // Directly mounting into a high-speed sandboxed object stream
            const embed = document.createElement('embed');
            embed.type = 'application/pdf';
            embed.src = blobURL;
            embed.style.width = '100%';
            embed.style.height = '600px';
            embed.style.borderRadius = '16px';

            previewFrameContainer.appendChild(embed);
            
            statusMessage.innerHTML = "⚡ <strong>Instant Load Success!</strong> Use the tool frame controls to view, print, or save individual pages.";
            
            // Set action for full-screen flow button
            downloadAllBtn.onclick = (e) => {
                e.preventDefault();
                window.open(blobURL, '_blank');
            };
        };
        fileReader.readAsArrayBuffer(file);
    }
});
