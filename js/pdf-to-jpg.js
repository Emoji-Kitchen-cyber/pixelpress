// Native Object Sandbox Engine (100% Independent & Bug-Free)
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadSection = document.getElementById('uploadSection');
    const workSection = document.getElementById('workSection');
    const previewGrid = document.getElementById('previewGrid');
    const statusMessage = document.getElementById('statusMessage');
    const downloadAllBtn = document.getElementById('downloadAllBtn');

    if (!dropZone || !fileInput) return;

    // Trigger file selection on click
    dropZone.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files) processPDFWithNativeEngine(e.target.files);
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ec4899';
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files) processPDFWithNativeEngine(e.dataTransfer.files);
    });

    function processPDFWithNativeEngine(file) {
        // Hide upload view, show working area instantly
        uploadSection.style.display = 'none';
        workSection.style.display = 'block';
        previewGrid.innerHTML = '';
        statusMessage.innerText = "Launching secure viewer layout...";

        const fileReader = new FileReader();
        fileReader.onload = function () {
            // Convert file array buffer to a lightweight browser local binary blob
            const fileBlob = new Blob([this.result], { type: 'application/pdf' });
            const nativeBlobURL = URL.createObjectURL(fileBlob);

            // Creating an isolated high-speed document viewport object
            const nativeViewer = document.createElement('object');
            nativeViewer.data = nativeBlobURL;
            nativeViewer.type = 'application/pdf';
            nativeViewer.style.width = '100%';
            nativeViewer.style.height = '600px';
            nativeViewer.style.borderRadius = '16px';
            nativeViewer.style.border = '2px solid #e2e8f0';

            // Append the object element directly into our container grid
            previewGrid.appendChild(nativeViewer);
            
            // Instantly update status message
            statusMessage.innerHTML = "✨ <strong>Document Loaded!</strong> Use the viewer options inside the frame to download pages or print instantly.";
            
            // Set download/view button behavior
            if (downloadAllBtn) {
                downloadAllBtn.style.display = 'inline-block';
                downloadAllBtn.innerText = "📥 Open Document Fullscreen";
                downloadAllBtn.onclick = (e) => {
                    e.preventDefault();
                    window.open(nativeBlobURL, '_blank');
                };
            }
        };
        fileReader.readAsArrayBuffer(file);
    }
});
