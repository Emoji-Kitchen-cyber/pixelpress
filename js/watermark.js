let baseImage = null;

setupUpload('watermarkUploadZone', 'watermarkFileInput', (img) => {
  baseImage = img;
  $('originalPreview').src = img.src;
  document.getElementById('upload-step').style.display = 'none';
  document.getElementById('settings-step').style.display = 'block';
});

$('applyWatermarkBtn').addEventListener('click', () => {
  const text = $('watermarkText').value;
  const opacity = parseInt($('opacitySlider').value) / 100;
  const canvas = document.createElement('canvas');
  canvas.width = baseImage.width;
  canvas.height = baseImage.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(baseImage, 0, 0);
  ctx.font = 'bold 40px Arial';
  ctx.fillStyle = `rgba(255,255,255,${opacity})`;
  ctx.fillText(text, 50, 60);
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    $('watermarkedPreview').src = url;
    document.getElementById('settings-step').style.display = 'none';
    document.getElementById('result-step').style.display = 'block';
    $('downloadBtn').onclick = () => downloadBlob(blob, 'watermarked.png');
  });
});