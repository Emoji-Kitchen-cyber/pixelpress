let originalFile = null;

setupUpload('compressUploadZone', 'compressFileInput', (img, file) => {
  originalFile = file;
  // Show original preview
  document.getElementById('originalPreview').src = img.src;
  document.getElementById('originalSize').textContent = formatBytes(file.size);
  // Move to settings step
  document.getElementById('upload-step').style.display = 'none';
  document.getElementById('settings-step').style.display = 'block';
});

$('qualitySlider').addEventListener('input', e => {
  $('qualityValue').textContent = e.target.value + '%';
});

$('compressBtn').addEventListener('click', async () => {
  if (!originalFile) return;
  // Show processing
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
    // Show result
    hideProcessing('processingBar');
    document.getElementById('processing-step').style.display = 'none';
    document.getElementById('result-step').style.display = 'block';
    $('compressedPreview').src = url;
    $('compressedSize').textContent = formatBytes(compressedBlob.size);
    // Save for download
    $('downloadBtn').onclick = () => downloadBlob(compressedBlob, 'compressed.' + originalFile.name.split('.').pop());
  } catch (err) {
    alert('Compression failed: ' + err.message);
    hideProcessing('processingBar');
    document.getElementById('processing-step').style.display = 'none';
    document.getElementById('settings-step').style.display = 'block';
  }
});

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}