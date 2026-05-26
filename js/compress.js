// ==================== ADVANCED COMPRESS TOOL ====================

let originalImage = null;
let originalFileName = '';

document.addEventListener('DOMContentLoaded', () => {

    const uploadZone = document.getElementById('compressUploadZone');
    const fileInput = document.getElementById('compressFileInput');
    const originalPreview = document.getElementById('originalPreview'); // agar HTML mein add kiya to

    const uploadStep = document.getElementById('upload-step');
    const settingsStep = document.getElementById('settings-step');
    const processingStep = document.getElementById('processing-step');
    const resultStep = document.getElementById('result-step');

    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const originalSizeEl = document.getElementById('originalSize');
    const compressedSizeEl = document.getElementById('compressedSize');

    // Quality Slider Live Update
    if (qualitySlider && qualityValue) {
        qualitySlider.addEventListener('input', () => {
            qualityValue.textContent = qualitySlider.value + '%';
        });
    }

    // ==================== UPLOAD HANDLER ====================
    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            alert('Sirf image file upload karein!');
            return;
        }

        originalFileName = file.name.replace(/\.[^/.]+$/, "");

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;

                // Show original size
                const sizeKB = (file.size / 1024).toFixed(1);
                if (originalSizeEl) originalSizeEl.textContent = sizeKB + ' KB';

                uploadStep.style.display = 'none';
                settingsStep.style.display = 'block';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Upload Events
    if (uploadZone && fileInput) {
        uploadZone.addEventListener('click', () => fileInput.click());

        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = '#3b82f6';
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.style.borderColor = '#cbd5e1';
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = '#cbd5e1';
            if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) handleFile(e.target.files[0]);
        });
    }

    // ==================== COMPRESS FUNCTION ====================
    const compressBtn = document.getElementById('compressBtn');
    if (compressBtn) {
        compressBtn.addEventListener('click', () => {
            if (!originalImage) return;

            settingsStep.style.display = 'none';
            processingStep.style.display = 'block';

            setTimeout(() => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = originalImage.width;
                    canvas.height = originalImage.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(originalImage, 0, 0);

                    const quality = parseFloat(qualitySlider.value) / 100;

                    canvas.toBlob((blob) => {
                        const url = URL.createObjectURL(blob);
                        const compressedPreview = document.getElementById('compressedPreview');
                        if (compressedPreview) compressedPreview.src = url;

                        // Show sizes
                        const compSize = (blob.size / 1024).toFixed(1);
                        document.getElementById('compSizeFinal').textContent = compSize + ' KB';
                        document.getElementById('origSizeFinal').textContent = 
                            ((originalImage.src.length * 0.75) / 1024).toFixed(1) + ' KB'; // approx

                        const savings = (((originalImage.src.length * 0.75 - blob.size) / (originalImage.src.length * 0.75)) * 100).toFixed(1);
                        document.getElementById('savings').textContent = `Size Reduced by ${savings}% 🎉`;

                        processingStep.style.display = 'none';
                        resultStep.style.display = 'block';

                        // Download
                        const downloadBtn = document.getElementById('downloadCompressBtn');
                        if (downloadBtn) {
                            downloadBtn.onclick = () => {
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${originalFileName}-compressed.png`;
                                a.click();
                            };
                        }
                    }, 'image/jpeg', quality);

                } catch (err) {
                    console.error(err);
                    alert('Compression failed. Please try again.');
                    processingStep.style.display = 'none';
                    settingsStep.style.display = 'block';
                }
            }, 100);
        });
    }
});