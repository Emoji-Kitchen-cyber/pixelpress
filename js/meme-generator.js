// ============================
// PixelPress Meme Generator
// ============================

const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d');
const templateGrid = document.getElementById('templateGrid');
const editorSection = document.getElementById('editorSection');
const layerList = document.getElementById('layerList');
const fontSizeSlider = document.getElementById('fontSizeSlider');
const fontFamilySelect = document.getElementById('fontFamilySelect');
const strokeCheck = document.getElementById('strokeCheck');
const addTextBtn = document.getElementById('addTextBtn');
const addStickerBtn = document.getElementById('addStickerBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const downloadMemeBtn = document.getElementById('downloadMemeBtn');
const exportFormat = document.getElementById('exportFormat');
const loadTemplatesBtn = document.getElementById('loadTemplatesBtn');
const customUploadBtn = document.getElementById('customUploadBtn');
const customFileInput = document.getElementById('customFileInput');
const darkModeToggle = document.getElementById('darkModeToggle');

// State
let layers = []; // each layer: { type: 'image'|'text', content, x, y, ... }
let selectedLayerIndex = -1;
let baseImage = null;
let history = [];
let historyIndex = -1;
const MAX_HISTORY = 30;

// Templates from memegen.link (free API)
const TEMPLATES_API = 'https://api.memegen.link/templates';

// --- Dark Mode ---
darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});

// --- Templates Loading ---
loadTemplatesBtn.addEventListener('click', async () => {
  templateGrid.innerHTML = '<p>Loading templates...</p>';
  try {
    const res = await fetch(TEMPLATES_API);
    const templates = await res.json();
    // Limit to 50 popular ones
    const popular = templates.slice(0, 50);
    templateGrid.innerHTML = popular.map(t => `
      <img src="${t.blank}" alt="${t.name}" data-id="${t.id}" title="${t.name}">
    `).join('');
    document.querySelectorAll('.template-grid img').forEach(img => {
      img.addEventListener('click', () => {
        document.querySelectorAll('.template-grid img').forEach(i => i.classList.remove('selected'));
        img.classList.add('selected');
        loadTemplateImage(img.src);
      });
    });
  } catch (err) {
    templateGrid.innerHTML = '<p>Failed to load templates. Check your connection.</p>';
  }
});

function loadTemplateImage(src) {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = () => {
    baseImage = img;
    canvas.width = img.width;
    canvas.height = img.height;
    layers = [{ type: 'image', image: img, x: 0, y: 0, width: img.width, height: img.height }];
    selectedLayerIndex = 0;
    pushHistory();
    renderAll();
    editorSection.style.display = 'block';
  };
  img.src = src;
}

// --- Custom Upload ---
customUploadBtn.addEventListener('click', () => customFileInput.click());
customFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      baseImage = img;
      canvas.width = img.width;
      canvas.height = img.height;
      layers = [{ type: 'image', image: img, x: 0, y: 0, width: img.width, height: img.height }];
      selectedLayerIndex = 0;
      pushHistory();
      renderAll();
      editorSection.style.display = 'block';
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

// --- Layer Management ---
function renderAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const layer of layers) {
    if (layer.type === 'image') {
      ctx.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height);
    } else if (layer.type === 'text') {
      ctx.save();
      ctx.font = `${layer.fontSize}px "${layer.fontFamily}"`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      if (layer.stroke) {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.strokeText(layer.text, canvas.width/2 + layer.x, layer.y);
      }
      ctx.fillStyle = layer.color || 'white';
      ctx.fillText(layer.text, canvas.width/2 + layer.x, layer.y);
      ctx.restore();
    }
  }
  updateLayerList();
}

function updateLayerList() {
  layerList.innerHTML = layers.map((layer, idx) => `
    <li class="${idx === selectedLayerIndex ? 'active' : ''}" data-index="${idx}">
      ${layer.type === 'image' ? '🖼 Background' : `🔤 ${layer.text}`}
    </li>
  `).join('');
  document.querySelectorAll('#layerList li').forEach(li => {
    li.addEventListener('click', () => {
      selectedLayerIndex = parseInt(li.dataset.index);
      updateLayerList();
    });
  });
}

// --- Add Text ---
addTextBtn.addEventListener('click', () => {
  layers.push({
    type: 'text',
    text: 'Your Text',
    fontSize: parseInt(fontSizeSlider.value),
    fontFamily: fontFamilySelect.value,
    color: 'white',
    stroke: strokeCheck.checked,
    x: 0,
    y: canvas.height * 0.1 // top 10%
  });
  selectedLayerIndex = layers.length - 1;
  pushHistory();
  renderAll();
});

// --- Add Sticker (emoji) ---
addStickerBtn.addEventListener('click', () => {
  const emoji = prompt('Enter an emoji (e.g., 😂):', '😂');
  if (emoji) {
    layers.push({
      type: 'text',
      text: emoji,
      fontSize: 50,
      fontFamily: 'Arial',
      color: 'white',
      stroke: false,
      x: 0,
      y: canvas.height * 0.5
    });
    selectedLayerIndex = layers.length - 1;
    pushHistory();
    renderAll();
  }
});

// --- Drag text on canvas ---
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let draggingLayerIndex = -1;

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mouseX = (e.clientX - rect.left) * scaleX;
  const mouseY = (e.clientY - rect.top) * scaleY;
  // find text layer under cursor
  for (let i = layers.length-1; i >= 0; i--) {
    const layer = layers[i];
    if (layer.type === 'text') {
      const textWidth = ctx.measureText(layer.text).width;
      const left = canvas.width/2 + layer.x - textWidth/2;
      const right = canvas.width/2 + layer.x + textWidth/2;
      const top = layer.y;
      const bottom = layer.y + layer.fontSize;
      if (mouseX >= left && mouseX <= right && mouseY >= top && mouseY <= bottom) {
        draggingLayerIndex = i;
        isDragging = true;
        dragStart = { x: mouseX - layer.x, y: mouseY - layer.y };
        canvas.style.cursor = 'grabbing';
        return;
      }
    }
  }
});
canvas.addEventListener('mousemove', (e) => {
  if (!isDragging || draggingLayerIndex === -1) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mouseX = (e.clientX - rect.left) * scaleX;
  const mouseY = (e.clientY - rect.top) * scaleY;
  const layer = layers[draggingLayerIndex];
  layer.x = mouseX - dragStart.x;
  layer.y = mouseY - dragStart.y;
  renderAll();
});
canvas.addEventListener('mouseup', () => { isDragging = false; draggingLayerIndex = -1; canvas.style.cursor = 'default'; });
canvas.addEventListener('mouseleave', () => { isDragging = false; draggingLayerIndex = -1; canvas.style.cursor = 'default'; });

// Touch drag
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const touchX = (touch.clientX - rect.left) * scaleX;
  const touchY = (touch.clientY - rect.top) * scaleY;
  for (let i = layers.length-1; i >= 0; i--) {
    const layer = layers[i];
    if (layer.type === 'text') {
      const textWidth = ctx.measureText(layer.text).width;
      if (touchX >= canvas.width/2 + layer.x - textWidth/2 && touchX <= canvas.width/2 + layer.x + textWidth/2 &&
          touchY >= layer.y && touchY <= layer.y + layer.fontSize) {
        draggingLayerIndex = i;
        isDragging = true;
        dragStart = { x: touchX - layer.x, y: touchY - layer.y };
        break;
      }
    }
  }
});
canvas.addEventListener('touchmove', (e) => {
  if (!isDragging) return;
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const touchX = (touch.clientX - rect.left) * scaleX;
  const touchY = (touch.clientY - rect.top) * scaleY;
  const layer = layers[draggingLayerIndex];
  layer.x = touchX - dragStart.x;
  layer.y = touchY - dragStart.y;
  renderAll();
});
canvas.addEventListener('touchend', () => { isDragging = false; draggingLayerIndex = -1; });

// --- Font/Size changes apply to selected layer ---
fontSizeSlider.addEventListener('input', () => {
  if (selectedLayerIndex >= 0 && layers[selectedLayerIndex].type === 'text') {
    layers[selectedLayerIndex].fontSize = parseInt(fontSizeSlider.value);
    renderAll();
  }
});
fontFamilySelect.addEventListener('change', () => {
  if (selectedLayerIndex >= 0 && layers[selectedLayerIndex].type === 'text') {
    layers[selectedLayerIndex].fontFamily = fontFamilySelect.value;
    renderAll();
  }
});
strokeCheck.addEventListener('change', () => {
  if (selectedLayerIndex >= 0 && layers[selectedLayerIndex].type === 'text') {
    layers[selectedLayerIndex].stroke = strokeCheck.checked;
    renderAll();
  }
});

// --- History ---
function pushHistory() {
  const data = canvas.toDataURL();
  if (historyIndex < history.length - 1) history = history.slice(0, historyIndex + 1);
  history.push(data);
  if (history.length > MAX_HISTORY) history.shift();
  historyIndex = history.length - 1;
}
undoBtn.addEventListener('click', () => {
  if (historyIndex > 0) {
    historyIndex--;
    restoreFromHistory();
  }
});
redoBtn.addEventListener('click', () => {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    restoreFromHistory();
  }
});
function restoreFromHistory() {
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    // Keep layers in sync (simplistic: replace layers with just the image layer)
    layers = [{ type: 'image', image: img, x: 0, y: 0, width: img.width, height: img.height }];
    selectedLayerIndex = 0;
    renderAll();
  };
  img.src = history[historyIndex];
}

// --- Download ---
downloadMemeBtn.addEventListener('click', () => {
  const format = exportFormat.value;
  const mime = `image/${format}`;
  const link = document.createElement('a');
  link.download = `meme.${format}`;
  link.href = canvas.toDataURL(mime, 0.95);
  link.click();
});