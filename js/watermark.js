// ==================== WATERMARK TOOL ====================

let baseImage = null;
let selectedPosition = 'top-left';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {

  // ---------- POSITION BUTTONS ----------
  document.querySelectorAll('.position-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.position-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedPosition = btn.dataset.position;
    });
  });

  // ---------- OPACITY DISPLAY ----------
  const opacitySlider = document.getElementById('opacitySlider');
  const opacityValue = document.getElementById('opacityValue');
  if (opacitySlider && opacityValue) {
    opacitySlider.addEventListener('input', (e) => {
      opacityValue.textContent = e.target.value + '%';
    });
  }

  // ---------- UPLOAD (uses common.js) ----------
  setupUpload('watermarkUploadZone', 'watermarkFileInput', (img) => {
    baseImage = img;
    const originalPreview = document.getElementById('originalPreview');
    if (originalPreview) originalPreview.src = img.src;

    document.getElementById('upload-step').style.display = 'none';
    document.getElementById('settings-step').style.display = 'block';
  });

  // ---------- APPLY WATERMARK ----------
  const applyBtn = document.getElementById('applyWatermarkBtn');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      if (!baseImage) {
        alert('Please upload an image first.');
        return;
      }

      const watermarkText = document.getElementById('watermarkText');
      const text = watermarkText ? watermarkText.value.trim() : '';
      if (!text) {
        alert('Please enter watermark text.');
        return;
      }

      const opacity = parseInt(opacitySlider.value, 10) / 100;

      // Show processing step
      document.getElementById('settings-step').style.display = 'none';
      document.getElementById('processing-step').style.display = 'block';

      // Use a short timeout so the UI updates before heavy processing
      setTimeout(() => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = baseImage.width;
          canvas.height = baseImage.height;
          const ctx = canvas.getContext('2d');

          // Draw original
          ctx.drawImage(baseImage, 0, 0);

          // Calculate font size based on image width
          const fontSize = Math.max(20, Math.floor(baseImage.width / 20));
          ctx.font = `bold ${fontSize}px Arial, sans-serif`;
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.textBaseline = 'top';

          const textWidth = ctx.measureText(text).width;
          const textHeight = fontSize;
          const padding = 30;

          let x, y;
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

          // Add shadow for readability
          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
          ctx.shadowBlur = 6;
          ctx.fillText(text, x, y);
          ctx.shadowColor = 'transparent';

          // Convert to blob and show result
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const watermarkedPreview = document.getElementById('watermarkedPreview');
            if (watermarkedPreview) watermarkedPreview.src = url;

            document.getElementById('processing-step').style.display = 'none';
            document.getElementById('result-step').style.display = 'block';

            // Download handler
            const downloadBtn = document.getElementById('downloadBtn');
            if (downloadBtn) {
              downloadBtn.onclick = () => {
                const a = document.createElement('a');
                a.href = url;
                a.download = 'watermarked.png';
                a.click();
              };
            }
          }, 'image/png');

        } catch (error) {
          alert('Watermarking failed. Please try again.');
          console.error(error);
          document.getElementById('processing-step').style.display = 'none';
          document.getElementById('settings-step').style.display = 'block';
        }
      }, 100);
    });
  }

});