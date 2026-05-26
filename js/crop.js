let img = null, scale = 1;
let startX = 0, startY = 0, endX = 0, endY = 0, isCropping = false;
let canvas, ctx;

setupUpload('cropUploadZone', 'cropFileInput', (loadedImg) => {
  img = loadedImg;
  canvas = $('cropCanvas');
  const maxW = Math.min(window.innerWidth - 40, 700);
  scale = Math.min(maxW / img.width, 1);
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  startX = 0; startY = 0;
  endX = canvas.width; endY = canvas.height;
  drawRect();
  document.getElementById('upload-step').style.display = 'none';
  document.getElementById('crop-step').style.display = 'block';
  attachEvents();
});

function attachEvents() {
  const getPos = e => {
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
  };
  canvas.addEventListener('mousedown', e => { isCropping = true; const p = getPos(e); startX = p.x; startY = p.y; });
  canvas.addEventListener('mousemove', e => { if (!isCropping) return; const p = getPos(e); endX = Math.max(0, Math.min(p.x, canvas.width)); endY = Math.max(0, Math.min(p.y, canvas.height)); drawRect(); });
  canvas.addEventListener('mouseup', () => { isCropping = false; });
  canvas.addEventListener('touchstart', e => { e.preventDefault(); isCropping = true; const p = getPos(e); startX = p.x; startY = p.y; });
  canvas.addEventListener('touchmove', e => { e.preventDefault(); if (!isCropping) return; const p = getPos(e); endX = Math.max(0, Math.min(p.x, canvas.width)); endY = Math.max(0, Math.min(p.y, canvas.height)); drawRect(); });
  canvas.addEventListener('touchend', () => { isCropping = false; });
}

function drawRect() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const x = Math.min(startX, endX), y = Math.min(startY, endY);
  const w = Math.abs(endX - startX), h = Math.abs(endY - startY);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(0,0,canvas.width,y);
  ctx.fillRect(0,y,x,h);
  ctx.fillRect(x+w,y,canvas.width-x-w,h);
  ctx.fillRect(0,y+h,canvas.width,canvas.height-y-h);
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

$('cropApplyBtn').addEventListener('click', () => {
  const x = Math.min(startX, endX), y = Math.min(startY, endY);
  const w = Math.abs(endX - startX), h = Math.abs(endY - startY);
  const outCanvas = document.createElement('canvas');
  outCanvas.width = w / scale;
  outCanvas.height = h / scale;
  const outCtx = outCanvas.getContext('2d');
  outCtx.drawImage(img, x/scale, y/scale, w/scale, h/scale, 0,0, w/scale, h/scale);
  const url = outCanvas.toDataURL();
  $('croppedPreview').src = url;
  document.getElementById('crop-step').style.display = 'none';
  document.getElementById('result-step').style.display = 'block';
  outCanvas.toBlob(blob => {
    $('downloadBtn').onclick = () => downloadBlob(blob, 'cropped.png');
  });
});

$('cropResetBtn').addEventListener('click', () => {
  if (!img) return;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  startX = 0; startY = 0; endX = canvas.width; endY = canvas.height;
  drawRect();
});