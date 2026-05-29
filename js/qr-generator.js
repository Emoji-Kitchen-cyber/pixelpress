// Isolated Core Logic Execution Pipeline
let qrcodeObj = null;

function generateQR() {
  const text = document.getElementById('qrText').value;
  const color = document.getElementById('qrColor').value;
  const qrContainer = document.getElementById('qrcode');
  
  qrContainer.innerHTML = '';
  if (!text.trim()) return;
  
  qrcodeObj = new QRCode(qrContainer, {
    text: text,
    width: 200,
    height: 200,
    colorDark: color,
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
}

function downloadQR() {
  const img = document.querySelector('#qrcode img');
  if (!img) return;
  const link = document.createElement('a');
  link.download = 'pixelpress-qr.png';
  link.href = img.src;
  link.click();
}

// System Theme Synchronizer Setup
const syncThemeMode = () => {
  const theme = localStorage.getItem('pixelpress-theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
};

// Event Subscriptions Matrix
document.getElementById('qrText').addEventListener('input', generateQR);
document.getElementById('qrColor').addEventListener('input', generateQR);
document.getElementById('downloadBtn').addEventListener('click', downloadQR);

window.addEventListener('DOMContentLoaded', () => {
  syncThemeMode();
  generateQR();
});
