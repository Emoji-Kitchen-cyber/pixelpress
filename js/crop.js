let cropOriginal = null;

document.addEventListener('DOMContentLoaded', () => {
    const uploadZone = document.getElementById('cropUploadZone');
    const fileInput = document.getElementById('cropFileInput');

    function handleFile(file) {
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => {
                cropOriginal = img;
                document.getElementById('cropPreview').src = e.target.result;
                document.getElementById('cropWidth').value = Math.floor(img.width * 0.8);
                document.getElementById('cropHeight').value = Math.floor(img.height * 0.8);
                document.getElementById('upload-step').style.display = 'none';
                document.getElementById('settings-step').style.display = 'block';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    uploadZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => e.target.files[0] && handleFile(e.target.files[0]));

    document.getElementById('cropBtn').addEventListener('click', () => {
        if (!cropOriginal) return;

        document.getElementById('settings-step').style.display = 'none';
        document.getElementById('processing-step').style.display = 'block';

        setTimeout(() => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const x = parseInt(document.getElementById('cropX').value) || 0;
            const y = parseInt(document.getElementById('cropY').value) || 0;
            const w = parseInt(document.getElementById('cropWidth').value);
            const h = parseInt(document.getElementById('cropHeight').value);

            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(cropOriginal, x, y, w, h, 0, 0, w, h);

            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                document.getElementById('croppedResult').src = url;
                document.getElementById('processing-step').style.display = 'none';
                document.getElementById('result-step').style.display = 'block';

                document.getElementById('downloadCropBtn').onclick = () => {
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'cropped-image.png';
                    a.click();
                };
            });
        }, 100);
    });
});