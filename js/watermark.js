let baseImage = null;
let selectedPosition = 'top-left'; // default

// Helper to get element by ID
const $ = id => document.getElementById(id);

// Position buttons
document.querySelectorAll('.position-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.position-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedPosition = btn.dataset.position;
  });
});

// Opacity display update
$('opacitySlider').addEventListener('input', (e) => {
  $('opacityValue').textContent = e.target.value + '%';
});

// Upload setup
setupUpload('watermarkUploadZone', 'watermarkFileInput', (img) => {
  baseImage = img;
  $('originalPreview').src = img.src;
  document.getElementById('upload-step').style.display = 'none';
  document.getElementById('settings-step').style.display = 'block';
});

// Apply watermark
$('applyWatermarkBtn').addEventListener('click', () => {
  if (!baseImage) {
    alert('Please upload an image first.');
    return;
  }

  const text = $('watermarkText').value.trim();
  if (!text) {
    alert('Please enter watermark text.');
    return;
  }

  const opacity = parseInt($('opacitySlider').value) / 100;

  // Show processing
  document.getElementById('settings-step').style.display = 'none';
  document.getElementById('processing-step').style.display = 'block';

  // Small delay to allow UI update
  setTimeout(() => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = baseImage.width;
      canvas.height = baseImage.height;
      const ctx = canvas.getContext('2d');

      // Draw original image
      ctx.drawImage(baseImage, 0, 0);

      // Set font and measure text
      const fontSize = Math.max(20, Math.floor(baseImage.width / 20));
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.textBaseline = 'top';

      const textWidth = ctx.measureText(text).width;
      const textHeight = fontSize;

      // Determine position
      let x, y;
      const padding = 30;
      switch (selectedPosition) {
        case 'top-left':
          x = padding;
          y = padding;
          break;
        case 'center':
          x = (canvas.width - textWidth) / 2;
          y = (canvas.height - textHeight) / 2;
          break;
        case 'bottom-right':
          x = canvas.width - textWidth - padding;
          y = canvas.height - textHeight - padding;
          break;
        default:
          x = padding;
          y = padding;
      }

      // Add a subtle shadow for readability
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(text, x, y);
      ctx.shadowColor = 'transparent'; // reset

      // Generate blob and show preview
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        $('watermarkedPreview').src = url;

        document.getElementById('processing-step').style.display = 'none';
        document.getElementById('result-step').style.display = 'block';

        // Download button
        $('downloadBtn').onclick = () => {
          downloadBlob(blob, 'watermarked.png');
        };
      }, 'image/png');

    } catch (error) {
      alert('Watermarking failed. Please try again.');
      console.error(error);
      document.getElementById('processing-step').style.display = 'none';
      document.getElementById('settings-step').style.display = 'block';
    }
  }, 100);
});