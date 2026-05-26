let imgOriginal = null, originalWidth, originalHeight;

setupUpload('resizeUploadZone', 'resizeFileInput', (img) => {
  imgOriginal = img;
  originalWidth = img.width;
  originalHeight = img.height;
  $('resizeWidth').value = originalWidth;
  $('resizeHeight').value = originalHeight;
  $('originalPreview').src = img.src;
  document.getElementById('upload-step').style.display = 'none';
  document.getElementById('settings-step').style.display = 'block';
});

$('resizeWidth').addEventListener('input', () => {
  if ($('lockAspect').checked && originalWidth) {
    $('resizeHeight').value = Math.round(($('resizeWidth').value / originalWidth) * originalHeight);
  }
});

$('resizeHeight').addEventListener('input', () => {
  if ($('lockAspect').checked && originalHeight) {
    $('resizeWidth').value = Math.round(($('resizeHeight').value / originalHeight) * originalWidth);
  }
});

$('resizeBtn').addEventListener('click', () => {
  const w = parseInt($('resizeWidth').value);
  const h = parseInt($('resizeHeight').value);
  if (!w || !h) return;
  document.getElementById('settings-step').style.display = 'none';
  document.getElementById('processing-step').style.display = 'block';
  setTimeout(() => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgOriginal, 0, 0, w, h);
    const dataURL = canvas.toDataURL('image/png');
    document.getElementById('processing-step').style.display = 'none';
    document.getElementById('result-step').style.display = 'block';
    $('resizedPreview').src = dataURL;
    canvas.toBlob(blob => {
      $('downloadBtn').onclick = () => downloadBlob(blob, 'resized.png');
    });
  }, 200);
});