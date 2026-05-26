let originalFile = null;

setupUpload('compressUploadZone', 'compressFileInput', (img, file) => {
  originalFile = file;
  $('originalPreview').src = img.src;
  $('originalSize').textContent = formatBytes(file.size);
  document.getElementById('upload-step').style.display = 'none';
  document.getElementById('settings-step').style.display = 'block';
});

$('qualitySlider').addEventListener('input', e => {
  $('qualityValue').textContent = e.target.value + '%';
});

$('compressBtn').addEventListener('click', async () => {
  if (!originalFile) return;
  document.getElementById('settings-step').style.display = 'none';
  document.getElementById('processing-step').style.display = 'block';
  showProcessing('processingBar');

  const quality = parseInt($('qualitySlider').value) / 100;
  try {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: quality
    };
    const compressedBlob = await imageCompression(originalFile, options);
    const url = URL.createObjectURL(compressedBlob);
    hideProcessing('processingBar');
    document.getElementById('processing-step').style.display = 'none';
    document.getElementById('result-step').style.display = 'block';
    $('compressedPreview').src = url;
    $('compressedSize').textContent = formatBytes(compressedBlob.size);
    $('downloadBtn').onclick = () => downloadBlob(compressedBlob, 'compressed.' + originalFile.name.split('.').pop());
  } catch (err) {
    alert('Compression failed: ' + err.message);
    hideProcessing('processingBar');
    document.getElementById('processing-step').style.display = 'none';
    document.getElementById('settings-step').style.display = 'block';
  }
});