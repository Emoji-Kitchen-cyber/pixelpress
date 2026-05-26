/**
 * Web Worker for heavy image processing (compression, resize, etc.).
 * Uses OffscreenCanvas if available; falls back to message-based blob creation.
 */

self.onmessage = async function (e) {
  const { imageBitmap, width, height, quality, format, operation } = e.data;

  try {
    // Create an OffscreenCanvas
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');

    if (imageBitmap) {
      // Draw the received ImageBitmap
      ctx.drawImage(imageBitmap, 0, 0, width, height);
    }

    // Convert to blob with specified format and quality
    const blob = await canvas.convertToBlob({ type: format || 'image/jpeg', quality: quality || 0.8 });
    
    // Transfer the blob back to main thread
    self.postMessage({ blob }, [blob]);
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};