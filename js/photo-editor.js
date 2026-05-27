const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadSection = document.getElementById('uploadSection');
const editorSection = document.getElementById('editorSection');
const mainCanvas = document.getElementById('mainCanvas');
const mainCtx = mainCanvas.getContext('2d');
const layersList = document.getElementById('layersList');
const statusBar = document.getElementById('statusBar');
const layerOpacity = document.getElementById('layerOpacity');
const layerBlend = document.getElementById('layerBlend');
const brushSize = document.getElementById('brushSize');
const colorPicker = document.getElementById('colorPicker');

let layerManager;
let originalImage = null;
let history = [];
let historyIndex = -1;
const MAX_HISTORY = 50;

let currentTool = null;
let isDrawing = false;
let drawStart = { x:0, y:0 };
let cropRect = null;

// Upload
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.borderColor = '#ec4899'; });
dropZone.addEventListener('dragleave', () => dropZone.style.borderColor = '#94a3b8');
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if(file && file.type.startsWith('image/')) loadImage(file);
});
fileInput.addEventListener('change', e => { if(e.target.files[0]) loadImage(e.target.files[0]); });

function loadImage(file) {
  const reader = new FileReader();
  reader.onload = function(ev) {
    const img = new Image();
    img.onload = function() {
      originalImage = img;
      mainCanvas.width = img.width;
      mainCanvas.height = img.height;
      layerManager = new LayerManager(mainCanvas);
      layerManager.reset(img);
      history = [mainCanvas.toDataURL()];
      historyIndex = 0;
      uploadSection.style.display = 'none';
      editorSection.style.display = 'block';
      renderLayerList();
      updateStatus('Image loaded');
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function renderLayerList() {
  layersList.innerHTML = layerManager.layers.map((layer,i) => `
    <li class="layer-item${i===layerManager.activeLayerIndex?' active':''}" data-index="${i}">
      <img class="layer-thumb" src="${layer.getDataURL()}" alt="thumb">
      <span>${layer.name}</span>
    </li>
  `).join('');
  document.querySelectorAll('.layer-item').forEach(item => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.dataset.index);
      layerManager.setActiveLayer(idx);
      renderLayerList();
      updateStatus(`Active layer: ${layerManager.getActiveLayer().name}`);
    });
  });
}

document.getElementById('addLayerBtn').addEventListener('click', () => {
  layerManager.addLayer(`Layer ${layerManager.layers.length+1}`);
  renderLayerList();
  pushHistory();
  compositeAndRender();
});
document.getElementById('deleteLayerBtn').addEventListener('click', () => {
  if(layerManager.removeLayer(layerManager.activeLayerIndex)) {
    renderLayerList();
    pushHistory();
    compositeAndRender();
  }
});
layerOpacity.addEventListener('input', () => {
  if(layerManager.getActiveLayer()) {
    layerManager.getActiveLayer().opacity = parseFloat(layerOpacity.value);
    compositeAndRender();
  }
});
layerBlend.addEventListener('change', () => {
  if(layerManager.getActiveLayer()) {
    layerManager.getActiveLayer().blendMode = layerBlend.value;
    compositeAndRender();
  }
});

function pushHistory() {
  const data = mainCanvas.toDataURL();
  if(historyIndex < history.length-1) history = history.slice(0, historyIndex+1);
  history.push(data);
  if(history.length > MAX_HISTORY) history.shift();
  historyIndex = history.length-1;
}
function undo() {
  if(historyIndex > 0) {
    historyIndex--;
    restoreFromHistory();
  }
}
function redo() {
  if(historyIndex < history.length-1) {
    historyIndex++;
    restoreFromHistory();
  }
}
function restoreFromHistory() {
  const img = new Image();
  img.onload = () => {
    mainCtx.clearRect(0,0,mainCanvas.width,mainCanvas.height);
    mainCtx.drawImage(img,0,0);
    layerManager.getActiveLayer().clear();
    layerManager.getActiveLayer().drawImage(img);
    layerManager.composite();
    renderLayerList();
    updateStatus('Undo/Redo');
  };
  img.src = history[historyIndex];
}
document.getElementById('undoBtn').addEventListener('click', undo);
document.getElementById('redoBtn').addEventListener('click', redo);
document.addEventListener('keydown', e => {
  if((e.ctrlKey || e.metaKey) && e.key==='z') {
    e.preventDefault();
    if(e.shiftKey) redo(); else undo();
  }
});

// Tools
const toolbarButtons = { cropBtn:'crop', drawBtn:'draw', textBtn:'text', shapeBtn:'shape', watermarkBtn:'watermark' };
Object.entries(toolbarButtons).forEach(([id, tool]) => {
  document.getElementById(id).addEventListener('click', () => {
    currentTool = currentTool===tool ? null : tool;
    document.querySelectorAll('.toolbar button').forEach(b => b.classList.remove('active'));
    if(currentTool) document.getElementById(id).classList.add('active');
    updateStatus(`Tool: ${currentTool||'none'}`);
  });
});

// Canvas interaction
mainCanvas.addEventListener('mousedown', onMouseDown);
mainCanvas.addEventListener('mousemove', onMouseMove);
mainCanvas.addEventListener('mouseup', onMouseUp);
mainCanvas.addEventListener('touchstart', onTouchStart);
mainCanvas.addEventListener('touchmove', onTouchMove);
mainCanvas.addEventListener('touchend', onTouchEnd);

function getCanvasCoords(e) {
  const rect = mainCanvas.getBoundingClientRect();
  const scaleX = mainCanvas.width / rect.width;
  const scaleY = mainCanvas.height / rect.height;
  return { x: (e.clientX - rect.left)*scaleX, y: (e.clientY - rect.top)*scaleY };
}
function onMouseDown(e) { handleStart(getCanvasCoords(e)); }
function onMouseMove(e) { if(isDrawing) handleMove(getCanvasCoords(e)); }
function onMouseUp(e) { handleEnd(); }
function onTouchStart(e) { e.preventDefault(); const t = e.touches[0]; handleStart(getCanvasCoords(t)); }
function onTouchMove(e) { e.preventDefault(); if(isDrawing) { const t = e.touches[0]; handleMove(getCanvasCoords(t)); } }
function onTouchEnd(e) { handleEnd(); }

function handleStart(pos) {
  if(!currentTool) return;
  const activeLayer = layerManager.getActiveLayer();
  if(!activeLayer) return;
  if(currentTool==='draw') {
    isDrawing = true;
    drawStart = pos;
    activeLayer.ctx.beginPath();
    activeLayer.ctx.moveTo(pos.x, pos.y);
    activeLayer.ctx.strokeStyle = colorPicker.value;
    activeLayer.ctx.lineWidth = brushSize.value;
  } else if(currentTool==='crop') {
    cropRect = { x:pos.x, y:pos.y, w:0, h:0 };
  }
}
function handleMove(pos) {
  if(currentTool==='draw' && isDrawing) {
    const activeLayer = layerManager.getActiveLayer();
    activeLayer.ctx.lineTo(pos.x, pos.y);
    activeLayer.ctx.stroke();
    compositeAndRender();
  } else if(currentTool==='crop' && cropRect) {
    cropRect.w = pos.x - cropRect.x;
    cropRect.h = pos.y - cropRect.y;
    compositeAndRender();
    mainCtx.save();
    mainCtx.strokeStyle = '#ec4899';
    mainCtx.lineWidth = 2;
    mainCtx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
    mainCtx.restore();
  }
}
function handleEnd() {
  if(currentTool==='draw') {
    isDrawing = false;
    pushHistory();
  } else if(currentTool==='crop' && cropRect) {
    applyCrop(cropRect);
    cropRect = null;
    currentTool = null;
    document.querySelectorAll('.toolbar button').forEach(b => b.classList.remove('active'));
  }
}
function applyCrop(rect) {
  const w = Math.abs(rect.w), h = Math.abs(rect.h);
  if(w<5||h<5) return;
  const x = Math.min(rect.x, rect.x+rect.w);
  const y = Math.min(rect.y, rect.y+rect.h);
  const cropped = mainCtx.getImageData(x,y,w,h);
  mainCanvas.width = w; mainCanvas.height = h;
  mainCtx.putImageData(cropped,0,0);
  layerManager.reset(mainCanvas);
  pushHistory();
  compositeAndRender();
  renderLayerList();
}

document.getElementById('textBtn').addEventListener('click', () => {
  if(currentTool==='text') {
    const text = prompt('Enter text:');
    if(text) {
      const activeLayer = layerManager.getActiveLayer();
      activeLayer.ctx.font = '40px sans-serif';
      activeLayer.ctx.fillStyle = colorPicker.value;
      activeLayer.ctx.fillText(text,50,50);
      compositeAndRender();
      pushHistory();
    }
    currentTool=null;
    document.getElementById('textBtn').classList.remove('active');
  }
});
document.getElementById('shapeBtn').addEventListener('click', () => {
  if(currentTool==='shape') {
    const shape = prompt('Shape (rect/circle):','rect');
    const activeLayer = layerManager.getActiveLayer();
    activeLayer.ctx.fillStyle = colorPicker.value;
    if(shape==='rect') activeLayer.ctx.fillRect(50,50,150,100);
    else { activeLayer.ctx.beginPath(); activeLayer.ctx.arc(100,100,50,0,Math.PI*2); activeLayer.ctx.fill(); }
    compositeAndRender();
    pushHistory();
    currentTool=null;
    document.getElementById('shapeBtn').classList.remove('active');
  }
});
document.getElementById('watermarkBtn').addEventListener('click', () => {
  const text = prompt('Watermark text:');
  if(text) {
    const activeLayer = layerManager.getActiveLayer();
    activeLayer.ctx.save();
    activeLayer.ctx.globalAlpha = 0.5;
    activeLayer.ctx.font = '30px sans-serif';
    activeLayer.ctx.fillStyle = '#ffffff';
    activeLayer.ctx.fillText(text,20,mainCanvas.height-20);
    activeLayer.ctx.restore();
    compositeAndRender();
    pushHistory();
  }
});
document.getElementById('bgRemoveBtn').addEventListener('click', async () => {
  if(!window.removeBackground) { alert('Background removal library not loaded.'); return; }
  updateStatus('Removing background...');
  const imageBlob = await fetch(mainCanvas.toDataURL()).then(r=>r.blob());
  try {
    const resultBlob = await removeBackground(imageBlob, { model:'medium', output:{ format:'image/png' } });
    const url = URL.createObjectURL(resultBlob);
    const img = new Image();
    img.onload = () => {
      layerManager.addLayer('Background Removed', img.width, img.height);
      layerManager.getActiveLayer().drawImage(img);
      compositeAndRender();
      pushHistory();
      renderLayerList();
      updateStatus('Background removed');
    };
    img.src = url;
  } catch(err) { alert('Background removal failed: '+err.message); updateStatus('Error'); }
});
document.getElementById('autoEnhanceBtn').addEventListener('click', () => {
  if(!originalImage) return;
  const imageData = mainCtx.getImageData(0,0,mainCanvas.width,mainCanvas.height);
  const data = imageData.data;
  let min=255, max=0;
  for(let i=0;i<data.length;i+=4) {
    const gray = 0.299*data[i]+0.587*data[i+1]+0.114*data[i+2];
    if(gray<min) min=gray;
    if(gray>max) max=gray;
  }
  if(max===min) return;
  const range = max-min;
  for(let i=0;i<data.length;i+=4) {
    data[i] = ((data[i]-min)/range)*255;
    data[i+1] = ((data[i+1]-min)/range)*255;
    data[i+2] = ((data[i+2]-min)/range)*255;
  }
  mainCtx.putImageData(imageData,0,0);
  layerManager.getActiveLayer().clear();
  layerManager.getActiveLayer().drawImage(mainCanvas);
  compositeAndRender();
  pushHistory();
  updateStatus('Auto enhanced');
});

function compositeAndRender() { layerManager.composite(); renderLayerList(); }
document.getElementById('resetAllBtn').addEventListener('click', () => {
  if(originalImage) { layerManager.reset(originalImage); pushHistory(); compositeAndRender(); renderLayerList(); updateStatus('Reset'); }
});
document.getElementById('flattenBtn').addEventListener('click', () => {
  layerManager.flatten(); pushHistory(); compositeAndRender(); renderLayerList(); updateStatus('Flattened');
});
document.getElementById('downloadBtn').addEventListener('click', () => {
  const format = prompt('Format (png/jpeg/webp):','png');
  const link = document.createElement('a');
  link.download = `pixelpress-edited.${format}`;
  link.href = mainCanvas.toDataURL(`image/${format}`,0.92);
  link.click();
});
function updateStatus(msg) { statusBar.textContent = msg; }
setInterval(() => { if(mainCanvas.width>0) localStorage.setItem('photoEditorState', mainCanvas.toDataURL()); }, 30000);
