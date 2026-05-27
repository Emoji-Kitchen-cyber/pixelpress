document.addEventListener('DOMContentLoaded', () => {
    const uploadZone = document.getElementById('convertUploadZone');
    const fileInput = document.getElementById('convertFileInput');
    const convertBtn = document.getElementById('convertBtn');
    const formatSelect = document.getElementById('formatSelect');
    const convertedPreview = document.getElementById('convertedPreview');
    const downloadConvertBtn = document.getElementById('downloadConvertBtn');

    const uploadStep = document.getElementById('upload-step');
    const settingsStep = document.getElementById('settings-step');
    const processingStep = document.getElementById('processing-step');
    const resultStep = document.getElementById('result-step');

    let imgDataUrl = '';
    let originalFileName = 'image';

    function changeStep(stepId) {
        uploadStep.classList.remove('active');
        settingsStep.classList.remove('active');
        processingStep.classList.remove('active');
        resultStep.classList.remove('active');
        document.getElementById(stepId).classList.add('active');
    }

    uploadZone.onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files);
    };

    uploadZone.ondragover = (e) => { e.preventDefault(); uploadZone.style.borderColor = '#14b8a6'; };
    uploadZone.ondragleave = () => { uploadZone.style.borderColor = '#cbd5e1'; };
    uploadZone.ondrop = (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = '#cbd5e1';
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files);
    };

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload a valid image file!');
            return;
        }
        originalFileName = file.name.substring(0, file.name.lastIndexOf('.')) || 'image';
        const reader = new FileReader();
        reader.onload = (event) => {
            imgDataUrl = event.target.result;
            changeStep('settings-step');
        };
        reader.readAsDataURL(file);
    }

    convertBtn.onclick = () => {
        changeStep('processing-step');
        
        const img = new Image();
        img.src = imgDataUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');

            const format = formatSelect.value;
            if (format === 'image/jpeg') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(img, 0, 0);

            convertedPreview.src = canvas.toDataURL(format, 0.92);
            
            setTimeout(() => {
                changeStep('result-step');
            }, 400);
        };
    };

    downloadConvertBtn.onclick = () => {
        if (!convertedPreview.src) return;
        const format = formatSelect.value;
        const ext = format === 'image/jpeg' ? 'jpg' : format.split('/');
        const link = document.createElement('a');
        link.download = `${originalFileName}_pixelpress.${ext}`;
        link.href = convertedPreview.src;
        link.click();
    };
});
