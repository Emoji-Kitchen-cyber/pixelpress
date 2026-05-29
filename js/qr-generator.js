(function () {
  'use strict';

  const theme = localStorage.getItem('pixelpress-theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  document.documentElement.setAttribute('data-theme', theme);

  const $ = (selector) => document.querySelector(selector);

  const qrContent = $('#qrContent');
  const qrSize = $('#qrSize');
  const qrMargin = $('#qrMargin');
  const foreground = $('#foreground');
  const background = $('#background');
  const generateBtn = $('#generateBtn');
  const downloadBtn = $('#downloadBtn');
  const previewWrapper = $('#previewWrapper');
  const qrPreview = $('#qrPreview');
  const hiddenQrContainer = $('#hiddenQrContainer');
  const themeToggle = $('#themeToggle');
  const toast = $('#toast');

  let liveQRCode = null;
  let hiddenQRCode = null;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(window.__toastTimer);

    window.__toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2600);
  }

  function syncTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('pixelpress-theme', nextTheme);
  }

  themeToggle.addEventListener('click', syncTheme);

  function createQRCode() {
    const value = qrContent.value.trim();

    if (!value) {
      showToast('Please enter QR content.');
      return;
    }

    qrPreview.innerHTML = '';
    hiddenQrContainer.innerHTML = '';

    previewWrapper.style.width = `${qrSize.value}px`;
    previewWrapper.style.height = `${qrSize.value}px`;

    liveQRCode = new QRCode(qrPreview, {
      text: value,
      width: parseInt(qrSize.value, 10),
      height: parseInt(qrSize.value, 10),
      colorDark: foreground.value,
      colorLight: background.value,
      correctLevel: QRCode.CorrectLevel.H,
    });

    hiddenQRCode = new QRCode(hiddenQrContainer, {
      text: value,
      width: 512,
      height: 512,
      colorDark: foreground.value,
      colorLight: background.value,
      correctLevel: QRCode.CorrectLevel.H,
    });

    showToast('QR code generated successfully.');
  }

  function downloadQRCode() {
    const canvas = hiddenQrContainer.querySelector('canvas');
    const image = hiddenQrContainer.querySelector('img');

    let source = null;

    if (canvas) {
      source = canvas.toDataURL('image/png');
    }

    if (!source && image) {
      source = image.src;
    }

    if (!source) {
      showToast('Generate a QR code first.');
      return;
    }

    const link = document.createElement('a');
    link.href = source;
    link.download = 'pixelpress-qr-code.png';

    document.body.appendChild(link);
    link.click();
    link.remove();

    showToast('PNG download started.');
  }

  generateBtn.addEventListener('click', createQRCode);
  downloadBtn.addEventListener('click', downloadQRCode);

  qrContent.addEventListener('input', () => {
    if (qrContent.value.trim().length > 0) {
      createQRCode();
    }
  });

  foreground.addEventListener('input', createQRCode);
  background.addEventListener('input', createQRCode);
  qrSize.addEventListener('change', createQRCode);
  qrMargin.addEventListener('change', createQRCode);

  createQRCode();
})();
