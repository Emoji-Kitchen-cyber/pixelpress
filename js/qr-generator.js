let qrcodeObj = null;

function generateQR() {
  const text = document.getElementById('qrText').value;
  const color = document.getElementById('qrColor').value;
  const qrContainer = document.getElementById('qrcode');
  
  qrContainer.innerHTML = '';
  if (!text.trim()) return;
  
  // High-Res production configuration matrix
  qrcodeObj = new QRCode(qrContainer, {
    text: text,
    width: 512, // Native upscale rendering for true crystal clear quality
    height: 512,
    colorDark: color,
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });

  // Force styling adjustment to box context bounds
  const generatedImg = qrContainer.querySelector('img');
  const generatedCanvas = qrContainer.querySelector('canvas');
  if(generatedImg) generatedImg.style.width = "200px";
  if(generatedCanvas) generatedCanvas.style.width = "200px";
}

function downloadQR() {
  // Fault-tolerant engine checking both canvas and image pipeline targets
  const canvas = document.querySelector('#qrcode canvas');
  const img = document.querySelector('#qrcode img');
  const link = document.createElement('a');
  link.download = 'pixelpress-qrcode.png';

  if (canvas && canvas.getContext) {
    link.href = canvas.toDataURL("image/png");
    link.click();
  } else if (img && img.src && !img.src.startsWith('data:text/html')) {
    link.href = img.src;
    link.click();
  } else {
    alert("Generation tracking delay. Please modify the input text and try again.");
  }
}

const syncThemeMode = () => {
  const theme = localStorage.getItem('pixelpress-theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
};

document.getElementById('qrText').addEventListener('input', generateQR);
document.getElementById('qrColor').addEventListener('input', generateQR);
document.getElementById('downloadBtn').addEventListener('click', downloadQR);

window.addEventListener('DOMContentLoaded', () => {
  syncThemeMode();
  generateQR();
});

