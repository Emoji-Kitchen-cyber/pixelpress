document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const uploadOverlay = document.getElementById('uploadOverlay');
  const imageElement = document.getElementById('imageToCrop');
  
  let cropper = null;
  let currentFile = null;
  let flipX = 1;
  let flipY = 1;

  // --- Upload Handling ---
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFile(e.target.files);
  });

  function handleFile(file) {
    if (!file.type.startsWith('image/')) return alert('Please upload an image file.');
    currentFile = file;
    const url = URL.createObjectURL(file);
    imageElement.src = url;
    imageElement.classList.remove('hidden');
    uploadOverlay.classList.add('hidden');
    
    // Auto-select format based on input
    const formatSelect = document.getElementById('exportFormat');
    if(file.type === 'image/png') formatSelect.value = 'image/png';
    else if(file.type === 'image/webp') formatSelect.value = 'image/webp';
    else formatSelect.value = 'image/jpeg';

    initCropper();
  }

  // --- Cropper Initialization ---
  function initCropper() {
    if (cropper) cropper.destroy();
    cropper = new Cropper(imageElement, {
      viewMode: 2,
      background: false,
      autoCropArea: 0.8,
      responsive: true,
      zoom(event) { document.getElementById('zoomSlider').value = event.detail.ratio; }
    });
  }

  // --- Controls ---
  document.getElementById('ratioButtons').addEventListener('click', (e) => {
    if (!e.target.classList.contains('ratio-btn') || !cropper) return;
    document.querySelectorAll('#ratioButtons .ratio-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    const ratio = parseFloat(e.target.dataset.ratio);
    cropper.setAspectRatio(isNaN(ratio) ? NaN : ratio);
  });

  document.getElementById('btnRotateLeft').addEventListener('click', () => cropper && cropper.rotate(-90));
  document.getElementById('btnRotateRight').addEventListener('click', () => cropper && cropper.rotate(90));
  
  document.getElementById('btnFlipH').addEventListener('click', () => {
    if (!cropper) return;
    flipX = flipX === 1 ? -1 : 1;
    cropper.scaleX(flipX);
  });
  document.getElementById('btnFlipV').addEventListener('click', () => {
    if (!cropper) return;
    flipY = flipY === 1 ? -1 : 1;
    cropper.scaleY(flipY);
  });

  const zoomSlider = document.getElementById('zoomSlider');
  zoomSlider.addEventListener('input', (e) => {
    if (!cropper) return;
    cropper.zoomTo(parseFloat(e.target.value));
    document.getElementById('zoomVal').innerText = Math.round(e.target.value * 100) + '%';
  });

  // --- Export & Download ---
  document.getElementById('btnCropDownload').addEventListener('click', () => {
    if (!cropper) return;
    
    const format = document.getElementById('exportFormat').value;
    const extension = format.split('/');
    const originalName = currentFile.name.split('.');

    const canvas = cropper.getCroppedCanvas({
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${originalName}-cropped.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, format, 0.95); // 0.95 quality for premium result
  });
});
