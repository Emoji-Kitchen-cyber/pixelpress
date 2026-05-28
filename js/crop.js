document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');
  const uploadOverlay = document.getElementById('uploadOverlay');
  const image = document.getElementById('imageToCrop');
  const downloadBtn = document.getElementById('downloadBtn');
  
  let cropper = null;
  let scaleX = 1;
  let scaleY = 1;

  // Trigger File Upload Click
  dropZone.addEventListener('click', () => fileInput.click());

  // Drag & Drop Handlers
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files);
    }
  });

  // Load image into Cropper
  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      image.src = event.target.result;
      uploadOverlay.classList.add('hidden');
      downloadBtn.classList.remove('hidden');

      // Initialize CropperJS safely
      if (cropper) {
        cropper.destroy();
      }

      cropper = new Cropper(image, {
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 0.8,
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false
      });
    };
    reader.readAsDataURL(file);
  }

  // Aspect Ratio Selection
  const ratioButtons = document.querySelectorAll('.ratio-btn');
  ratioButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!cropper) return;
      ratioButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const ratioValue = parseFloat(btn.getAttribute('data-ratio'));
      cropper.setAspectRatio(isNaN(ratioValue) ? NaN : ratioValue);
    });
  });

  // Rotation Controls
  document.getElementById('rotateLeftBtn').addEventListener('click', () => {
    if (cropper) cropper.rotate(-90);
  });

  document.getElementById('rotateRightBtn').addEventListener('click', () => {
    if (cropper) cropper.rotate(90);
  });

  // Flip Controls
  document.getElementById('flipXBtn').addEventListener('click', () => {
    if (!cropper) return;
    scaleX = scaleX === 1 ? -1 : 1;
    cropper.scaleX(scaleX);
  });

  document.getElementById('flipYBtn').addEventListener('click', () => {
    if (!cropper) return;
    scaleY = scaleY === 1 ? -1 : 1;
    cropper.scaleY(scaleY);
  });

  // Download Trigger
  downloadBtn.addEventListener('click', () => {
    if (!cropper) return;
    
    // Get cropped canvas
    const canvas = cropper.getCroppedCanvas({
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    });

    // Create virtual download anchor
    const link = document.createElement('a');
    link.download = 'pixelpress-cropped.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
});



