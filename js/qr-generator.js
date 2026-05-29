let qrcodeObj = null;

function generateQR() {
  const textInput = document.getElementById('qrText');
  const colorInput = document.getElementById('qrColor');
  const qrContainer = document.getElementById('qrcode');
  
  if (!textInput || !colorInput || !qrContainer) return; // Failsafe
  
  const text = textInput.value;
  const color = colorInput.value;
  
  qrContainer.innerHTML = '';
  if (!text.trim()) return;
  
  qrcodeObj = new QRCode(qrContainer, {
    text: text,
    width: 512,
    height: 512,
    colorDark: color,
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });

  // Scale down visually, keep high-res for download
  setTimeout(() => {
    const generatedImg = qrContainer.querySelector('img');
    const generatedCanvas = qrContainer.querySelector('canvas');
    if(generatedImg) generatedImg.style.width = "200px";
    if(generatedCanvas) generatedCanvas.style.width = "200px";
  }, 50);
}

function downloadQR() {
  const canvas = document.querySelector('#qrcode canvas');
  const img = document.querySelector('#qrcode img');
  const link = document.createElement('a');
  link.download = 'pixelpress-qrcode.png';

  if (canvas && canvas.getContext) {
    link.href = canvas.toDataURL("image/png");
    link.click();
  } else if (img && img.src) {
    link.href = img.src;
    link.click();
  } else {
    alert("Please wait a second for the QR code to render before downloading.");
  }
}

function syncThemeMode() {
  const theme = localStorage.getItem('pixelpress-theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
}

// Attach Events
document.getElementById('qrText').addEventListener('input', generateQR);
document.getElementById('qrColor').addEventListener('input', generateQR);
document.getElementById('downloadBtn').addEventListener('click', downloadQR);

// Direct Execution (Bypasses DOMContentLoaded issues)
syncThemeMode();
generateQR();
