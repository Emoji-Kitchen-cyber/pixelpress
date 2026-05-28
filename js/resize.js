// Advanced Resizer Core Processing Engine Node
let globalImageElement = new Image();
let originalWidth = 0;
let originalHeight = 0;
let aspectMultiplier = 1;
let selectedResizeMode = 'pixels'; // defaults mode
let selectedPercentScale = 75;

// Elements DOM Cache Hooking
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const workspaceBox = document.getElementById('workspace');
const imagePreview = document.getElementById('imagePreview');
const imgMetaLabel = document.getElementById('imgMeta');
const resizeWidthInput = document.getElementById('resizeWidth');
const resizeHeightInput = document.getElementById('resizeHeight');
const maintainAspectCheck = document.getElementById('maintainAspect');

// Input file selection change trigger event listener
fileInput.addEventListener('change', function(e) {
    if(e.target.files.length > 0) {
        processIncomingFile(e.target.files[0]);
    }
});

// Drag and drop event listeners implementation
if(dropZone) {
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => { e.preventDefault(); dropZone.style.borderColor = '#ec4899'; }, false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => { e.preventDefault(); dropZone.style.borderColor = '#cbd5e1'; }, false);
    });
    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if(dt.files.length > 0) { processIncomingFile(dt.files[0]); }
    });
}

function processIncomingFile(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        globalImageElement.src = event.target.result;
        globalImageElement.onload = function() {
            // Save absolute metrics bounds
            originalWidth = globalImageElement.width;
            originalHeight = globalImageElement.height;
            aspectMultiplier = originalWidth / originalHeight;

            // Populate calculations data properties
            resizeWidthInput.value = originalWidth;
            resizeHeightInput.value = originalHeight;
            imgMetaLabel.innerText = `Original Dimensions: ${originalWidth} x ${originalHeight} px`;

            // Calculate live percent subtitles bounds helper
            updatePercentLabelsText();

            // Toggle Visual States safely
            dropZone.style.display = 'none';
            workspaceBox.style.display = 'grid';
            imagePreview.src = event.target.result;
        };
    };
    reader.readAsDataURL(file);
}

// Proportional Aspect Ratio Synchronization Locks Engine
resizeWidthInput.addEventListener('input', function() {
    if(maintainAspectCheck.checked && originalWidth > 0) {
        resizeHeightInput.value = Math.round(this.value / aspectMultiplier);
    }
});

resizeHeightInput.addEventListener('input', function() {
    if(maintainAspectCheck.checked && originalHeight > 0) {
        resizeWidthInput.value = Math.round(this.value * aspectMultiplier);
    }
});

function switchTab(mode) {
    selectedResizeMode = mode;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.config-section').forEach(sec => sec.classList.remove('active'));

    if(mode === 'pixels') {
        event.currentTarget.classList.add('active');
        document.getElementById('pixelsSection').classList.add('active');
    } else {
        event.currentTarget.classList.add('active');
        document.getElementById('percentageSection').classList.add('active');
    }
}

function selectPercent(val, element) {
    selectedPercentScale = val;
    document.querySelectorAll('.percent-card').forEach(card => card.classList.remove('active'));
    element.classList.add('active');
}

function updatePercentLabelsText() {
    document.getElementById('label75').innerText = `${Math.round(originalWidth * 0.75)}px x ${Math.round(originalHeight * 0.75)}px target output`;
    document.getElementById('label50').innerText = `${Math.round(originalWidth * 0.50)}px x ${Math.round(originalHeight * 0.50)}px target output`;
    document.getElementById('label25').innerText = `${Math.round(originalWidth * 0.25)}px x ${Math.round(originalHeight * 0.25)}px target output`;
}

// Highly Responsive HTML5 Canvas Resizer Pipeline Core Execution
function executeResize() {
    if(!globalImageElement.src) return alert('Please upload a file source first.');

    let finalTargetWidth = 0;
    let finalTargetHeight = 0;

    if(selectedResizeMode === 'pixels') {
        finalTargetWidth = parseInt(resizeWidthInput.value);
        finalTargetHeight = parseInt(resizeHeightInput.value);
    } else {
        let fraction = selectedPercentScale / 100;
        finalTargetWidth = Math.round(originalWidth * fraction);
        finalTargetHeight = Math.round(originalHeight * fraction);
    }

    if(isNaN(finalTargetWidth) || finalTargetWidth <= 0 || isNaN(finalTargetHeight) || finalTargetHeight <= 0) {
        return alert('Please specify valid bounds dimensions metrics layout.');
    }

    // Canvas Downscaling Engine Pipeline Instantiation
    const processingCanvas = document.createElement('canvas');
    const drawingContext = processingCanvas.getContext('2d');
    processingCanvas.width = finalTargetWidth;
    processingCanvas.height = finalTargetHeight;

    // Apply bicubic smoothing configuration vectors parameters
    drawingContext.imageSmoothingEnabled = true;
    drawingContext.imageSmoothingQuality = 'high';

    // Draw operations bounds matrices execution
    drawingContext.drawImage(globalImageElement, 0, 0, finalTargetWidth, finalTargetHeight);

    // Dynamic processing parameters extraction settings
    const structuralCompressionRatio = parseFloat(document.getElementById('outputQuality').value || "0.92");
    
    // Convert downstream pipeline target blob layout
    const systemTriggerExtension = fileInput.files[0].type || "image/jpeg";
    const processedOutputDataUrl = processingCanvas.toDataURL(systemTriggerExtension, structuralCompressionRatio);

    // Auto-triggered Downloader Anchor Node Instantiation
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = processedOutputDataUrl;
    
    // Construct dynamic clean target namespace output file asset configuration
    const legacyBaseName = fileInput.files[0].name.substring(0, fileInput.files[0].name.lastIndexOf('.')) || "resized-image";
    downloadAnchor.download = `${legacyBaseName}_resized_${finalTargetWidth}x${finalTargetHeight}.${systemTriggerExtension.split('/')[1]}`;
    
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
}
