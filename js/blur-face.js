


document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');
  const uploadOverlay = document.getElementById('uploadOverlay');
  const canvas = document.getElementById('mainCanvas');
  const downloadBtn = document.getElementById('downloadBtn');
  const blurSlider = document.getElementById('blurSlider');
  const blurValueLabel = document.getElementById('blurValue');
  const statusBox = document.getElementById('statusBox');

  let ctx = canvas.getContext('2d');
  let loadedImage = null;
  let detectedFaces = [];
  let modelLoaded = false;

  // Trigger click
  dropZone.addEventListener('click', () => fileInput.click());

  // Input listeners
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files);
  });

  blurSlider.addEventListener('input', (e) => {
    blurValueLabel.textContent = `${e.target.value}px`;
    if (loadedImage && detectedFaces.length > 0) {
      applyFaceBlur();
    }
  });

  async function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please provide a valid image.');
      return;
    }

    statusBox.textContent = "Loading AI Models... Please wait...";
    uploadOverlay.classList.add('hidden');
    
    // Load face-api models if not already loaded
    if (!modelLoaded) {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://vladmandic.github.io/face-api/model/');
        modelLoaded = true;
      } catch (err) {
        statusBox.textContent = "Error loading AI engine weights. Check connection.";
        console.error(err);
        return;
      }
    }

    statusBox.textContent = "Processing image & analyzing faces...";
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      loadedImage = new Image();
      loadedImage.onload = async () => {
        // Set canvas sizing match original
        canvas.width = loadedImage.width;
        canvas.height = loadedImage.height;
        ctx.drawImage(loadedImage, 0, 0);

        // Run face tracking
        detectedFaces = await faceapi.detectAllFaces(loadedImage, new faceapi.TinyFaceDetectorOptions());
        
        if (detectedFaces.length === 0) {
          statusBox.innerHTML = "⚠️ <strong>No faces detected.</strong> You can download or try another picture.";
        } else {
          statusBox.innerHTML = `✅ Successfully detected <strong>${detectedFaces.length}</strong> face(s).`;
          applyFaceBlur();
        }
        
        downloadBtn.classList.remove('hidden');
      };
      loadedImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  function applyFaceBlur() {
    if (!loadedImage) return;

    // Redraw fresh base layout
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(loadedImage, 0, 0);

    const blurRadius = parseInt(blurSlider.value);

    detectedFaces.forEach(face => {
      const { x, y, width, height } = face.box;

      // Extract bounding coordinates securely
      const padX = Math.max(0, x);
      const padY = Math.max(0, y);
      const padW = Math.min(width, canvas.width - padX);
      const padH = Math.min(height, canvas.height - padY);

      // Canvas magic tricks: creates sub canvas layer for smooth blending blur
      ctx.save();
      
      // Create a clipping region around face box boundary
      ctx.beginPath();
      ctx.rect(padX, padY, padW, padH);
      ctx.clip();

      // Draw blurred image patch over it
      ctx.filter = `blur(${blurRadius}px)`;
      ctx.drawImage(canvas, 0, 0);
      
      ctx.restore();
    });
  }

  // File Delivery
  downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'pixelpress-blurred.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
});
