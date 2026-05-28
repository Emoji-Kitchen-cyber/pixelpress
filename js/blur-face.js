document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');
  const uploadOverlay = document.getElementById('uploadOverlay');
  const canvas = document.getElementById('mainCanvas');
  const downloadBtn = document.getElementById('downloadBtn');
  const blurSlider = document.getElementById('blurSlider');
  const blurValueLabel = document.getElementById('blurValue');
  const statusBox = document.getElementById('statusBox');
  const clearBtn = document.getElementById('clearBtn');
  const canvasWrapper = document.getElementById('canvasWrapper');

  let ctx = canvas.getContext('2d');
  let loadedImage = null;
  let detectedFaces = [];
  let modelLoaded = false;
  let isDrawing = false;

  // Click & Drag actions
  dropZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files);
  });

  blurSlider.addEventListener('input', (e) => {
    blurValueLabel.textContent = `${e.target.value}px`;
    if (loadedImage) {
      applyBlurEffects();
    }
  });

  clearBtn.addEventListener('click', () => {
    if (loadedImage) {
      detectedFaces = [];
      applyBlurEffects();
      statusBox.textContent = "Image reset to original standard.";
    }
  });

  // Core File Upload Processor
  async function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Invalid image file extension type.');
      return;
    }

    statusBox.innerHTML = "🌀 Syncing AI neural models via CDN...";
    uploadOverlay.style.display = 'none'; // Force fallback hiding bypass `.hidden` rule
    
    // Load advanced high-accuracy face tracking weights
    if (!modelLoaded) {
      try {
        // Switching from TinyFace to advanced SSD Mobilenet V1
        await faceapi.nets.ssdMobilenetv1.loadFromUri('https://cdn.jsdelivr.net/gh/vladmandic/face-api/model/');
        modelLoaded = true;
      } catch (err) {
        console.warn("AI CDN failed. Activating Manual Touch Blur Override Module.");
        modelLoaded = false;
      }
    }

    statusBox.innerHTML = "⚙️ Executing deep scan face tracking pixels...";
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      loadedImage = new Image();
      loadedImage.onload = async () => {
        // Set full real size
        canvas.width = loadedImage.width;
        canvas.height = loadedImage.height;
        ctx.drawImage(loadedImage, 0, 0);

        if (modelLoaded) {
          try {
            // High confidence threshold scan
            detectedFaces = await faceapi.detectAllFaces(loadedImage, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }));
            statusBox.innerHTML = `🎉 AI detected <strong>${detectedFaces.length}</strong> face boundaries. Controls ready!`;
          } catch (aiErr) {
            detectedFaces = [];
            statusBox.innerHTML = "⚠️ AI detection paused. Manual clicking activated.";
          }
        } else {
          statusBox.innerHTML = "🖐️ Manual mode running. Click areas on image to blur.";
        }

        applyBlurEffects();
        downloadBtn.style.display = 'block'; // Direct bypass logic overrides all CSS blocks
      };
      loadedImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Dual engine blending logic: processes both automatic coordinates & manual overrides
  function applyBlurEffects() {
    if (!loadedImage) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(loadedImage, 0, 0);

    const radius = parseInt(blurSlider.value);

    // Render automatic detected boxes
    detectedFaces.forEach(face => {
      const { x, y, width, height } = face.box;
      injectBlurPatch(x, y, width, height, radius);
    });
  }

  // Render routine to apply precise layer filters locally
  function injectBlurPatch(targetX, targetY, targetW, targetH, blurRadius) {
    const safeX = Math.max(0, targetX);
    const safeY = Math.max(0, targetY);
    const safeW = Math.min(targetW, canvas.width - safeX);
    const safeH = Math.min(targetH, canvas.height - safeY);

    ctx.save();
    ctx.beginPath();
    ctx.rect(safeX, safeY, safeW, safeH);
    ctx.clip();

    ctx.filter = `blur(${blurRadius}px)`;
    ctx.drawImage(canvas, 0, 0);
    ctx.restore();
  }

  // Interactive Manual Click and Drag Processing Functionality
  function handleManualBlur(e) {
    if (!loadedImage) return;

    const rect = canvas.getBoundingClientRect();
    // Scale tracking algorithms to process real dimensions dynamically
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const boxSize = Math.max(canvas.width, canvas.height) * 0.07; // Dynamic brush sizing relative to raw resolution
    const radius = parseInt(blurSlider.value);

    injectBlurPatch(clickX - boxSize/2, clickY - boxSize/2, boxSize, boxSize, radius);
  }

  // Attach mouse control vectors to wrapper canvas elements
  canvas.addEventListener('mousedown', (e) => { isDrawing = true; handleManualBlur(e); });
  canvas.addEventListener('mousemove', (e) => { if(isDrawing) handleManualBlur(e); });
  window.addEventListener('mouseup', () => isDrawing = false);

  // Mobile Touch System Integration
  canvas.addEventListener('touchstart', (e) => {
    isDrawing = true;
    if(e.touches.length > 0) handleManualBlur(e.touches);
  });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if(isDrawing && e.touches.length > 0) handleManualBlur(e.touches);
  }, { passive: false });
  window.addEventListener('touchend', () => isDrawing = false);

  // Download Trigger Handler
  downloadBtn.addEventListener('click', () => {
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'pixelpress-ai-blurred.png';
      downloadLink.href = dataUrl;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      alert("Error parsing canvas. Please try a different source image.");
    }
  });
});


