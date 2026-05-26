let originalImage = null;

setupUpload('convertUploadZone', 'convertFileInput', (img) => {
  originalImage = img;
  $('originalPreview').src = img.src;
  document.getElementById('upload-step').style.display = 'none';
  document.getElementById('settings-step').style.display = 'block';
});

$('convertBtn').addEventListener('click', () => {
  const format = $('formatSelect').value;
  const mime = 'image/' + (format === 'jpg' ? 'jpeg' : format);
  const canvas = document.createElement('canvas');
  canvas.width = originalImage.width;
  canvas.height = originalImage.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(originalImage, 0, 0);
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    $('convertedPreview').src = url;
    document.getElementById('settings-step').style.display = 'none';
    document.getElementById('result-step').style.display = 'block';
    $('downloadBtn').onclick = () => downloadBlob(blob, 'converted.' + format);
  }, mime);
});