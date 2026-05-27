// Web Worker for image conversion – keeps UI responsive
self.onmessage = function(e) {
  const { imageData, format, quality, width, height, keepAspectRatio, removeMeta, fileName } = e.data;
  try {
    const img = new Image();
    img.onload = function() {
      let w = img.width, h = img.height;
      if (width && height) {
        if (keepAspectRatio) {
          const ratio = Math.min(width / w, height / h);
          w = w * ratio;
          h = h * ratio;
        } else {
          w = width;
          h = height;
        }
      } else if (width) {
        h = (width / img.width) * img.height;
        w = width;
      } else if (height) {
        w = (height / img.height) * img.width;
        h = height;
      }

      const canvas = new OffscreenCanvas(w, h);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      canvas.convertToBlob({ type: format, quality: quality }).then(blob => {
        self.postMessage({ blob, fileName });
      }).catch(err => {
        self.postMessage({ error: err.message, fileName });
      });
    };
    img.onerror = () => self.postMessage({ error: 'Failed to load image', fileName });
    img.src = imageData;
  } catch (err) {
    self.postMessage({ error: err.message, fileName });
  }
};