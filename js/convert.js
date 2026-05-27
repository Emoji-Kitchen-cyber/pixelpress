let convertOriginal = null;

document.addEventListener('DOMContentLoaded', () => {
    const uploadZone = document.getElementById('convertUploadZone');
    const fileInput = document.getElementById('convertFileInput');

    function handleFile(file) {
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => {
                convertOriginal = img;
                document.getElementById('upload-step').style.display = 'none';
                document.getElementById('settings-step').style.display = 'block';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    uploadZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => e.target.files[0] && handleFile(e.target.files[0]));

    document.getElementById('convertBtn').addEventListener('click', () => {
        if (!convertOriginal) return;

        document.getElementById('settings-step').style.display = 'none';
        document.getElementById('processing-step').style.display = 'block';

        setTimeout(() => {
            const canvas = document.createElement('canvas');
            canvas.width = convertOriginal.width;
            canvas.height = convertOriginal.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(convertOriginal, 0, 0);

            const format = document.getElementById('formatSelect').value;
            const quality = format === 'image/jpeg' || format === 'image/webp' ? 0.92 : 1;

            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                document.getElementById('convertedPreview').src = url;
                document.getElementById('processing-step').style.display = 'none';
                document.getElementById('result-step').style.display = 'block';

                document.getElementById('downloadConvertBtn').onclick = () => {
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `converted.${format.split('/')[1]}`;
                    a.click();
                };
            }, format, quality);
        }, 100);
    });
});