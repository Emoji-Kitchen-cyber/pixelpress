// ==================== ADVANCED WATERMARK TOOL ====================

let baseImage = null;
let selectedPosition = 'bottom-right';
let watermarkColor = '#ffffff';

document.addEventListener('DOMContentLoaded', () => {

    // Elements
    const uploadZone = document.getElementById('watermarkUploadZone');
    const fileInput = document.getElementById('watermarkFileInput');
    const originalPreview = document.getElementById('originalPreview');
    const watermarkedPreview = document.getElementById('watermarkedPreview');

    const uploadStep = document.getElementById('upload-step');
    const settingsStep = document.getElementById('settings-step');
    const processingStep = document.getElementById('processing-step');
    const resultStep = document.getElementById('result-step');

    const watermarkTextInput = document.getElementById('watermarkText');
    const opacitySlider = document.getElementById('opacitySlider');
    const opacityValue = document.getElementById('opacityValue');
    const colorPicker = document.getElementById('watermarkColor');
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const fontSizeValue = document.getElementById('fontSizeValue');

    // Position Buttons
    document.querySelectorAll('.position-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.position-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedPosition = btn.dataset.position;
        });
    });

    // Opacity Update
    if (opacitySlider && opacityValue) {
        opacitySlider.addEventListener('input', () => {
            opacityValue.textContent = opacitySlider.value + '%';
        });
    }

    // Font Size Update
    if (fontSizeSlider && fontSizeValue) {
        fontSizeSlider.addEventListener('input', () => {
            fontSizeValue.textContent = fontSizeSlider.value + 'px';
        });
    }

    // Color Picker
    if (colorPicker) {
        colorPicker.addEventListener('input', (e) => {
            watermarkColor = e.target.value;
        });
    }

    // ==================== UPLOAD HANDLER ====================
    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            alert('Sirf image file upload karein (JPG, PNG, WEBP)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                baseImage = img;
                if (originalPreview) originalPreview.src = e.target.result;

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
            uploadZone.style.borderColor = '#e5e7eb';
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = '#e5e7eb';
            if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) handleFile(e.target.files[0]);
        });
    }

    // ==================== APPLY WATERMARK ====================
    const applyBtn = document.getElementById('applyWatermarkBtn');
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            if (!baseImage) {
                alert('Pehle image upload karein!');
                return;
            }

            const text = watermarkTextInput ? watermarkTextInput.value.trim() : '';
            if (!text) {
                alert('Watermark text likhein!');
                return;
            }

            const opacity = parseFloat(opacitySlider.value) / 100;
            const fontSize = parseInt(fontSizeSlider.value) || 60;

            // Show processing
            settingsStep.style.display = 'none';
            processingStep.style.display = 'block';

            setTimeout(() => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = baseImage.width;
                    canvas.height = baseImage.height;
                    const ctx = canvas.getContext('2d');

                    // Draw original image
                    ctx.drawImage(baseImage, 0, 0);

                    // Watermark settings
                    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
                    ctx.fillStyle = hexToRgba(watermarkColor, opacity);
                    ctx.textBaseline = 'top';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                    ctx.shadowBlur = 8;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;

                    const textWidth = ctx.measureText(text).width;
                    const padding = 40;

                    let x, y;
                    switch (selectedPosition) {
                        case 'top-left':
                            x = padding;
                            y = padding;
                            break;
                        case 'top-right':
                            x = canvas.width - textWidth - padding;
                            y = padding;
                            break;
                        case 'center':
                            x = (canvas.width - textWidth) / 2;
                            y = (canvas.height - fontSize) / 2;
                            break;
                        case 'bottom-left':
                            x = padding;
                            y = canvas.height - fontSize - padding;
                            break;
                        case 'bottom-right':
                        default:
                            x = canvas.width - textWidth - padding;
                            y = canvas.height - fontSize - padding;
                    }

                    ctx.fillText(text, x, y);

                    // Show result
                    canvas.toBlob((blob) => {
                        const url = URL.createObjectURL(blob);
                        if (watermarkedPreview) watermarkedPreview.src = url;

                        processingStep.style.display = 'none';
                        resultStep.style.display = 'block';

                        // Download
                        const downloadBtn = document.getElementById('downloadBtn');
                        if (downloadBtn) {
                            downloadBtn.onclick = () => {
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `watermarked-${Date.now()}.png`;
                                a.click();
                            };
                        }
                    }, 'image/png', 0.95);

                } catch (err) {
                    console.error(err);
                    alert('Kuch error ho gaya. Dobara try karein.');
                    processingStep.style.display = 'none';
                    settingsStep.style.display = 'block';
                }
            }, 150);
        });
    }
});

// Helper function
function hexToRgba(hex, opacity) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}