// ==================== PIXELPRESS APP ====================

// ---------- STATE ----------
const state = {
  canvas: null,
  ctx: null,
  isDrawing: false,
  currentTool: 'pencil',
  color: '#ffffff',
  brushSize: 10,
  drawings: [],
  currentPage: 'editor',
  user: null
};

// ---------- INIT ----------
function init() {
  setupCanvas();
  setupTools();
  setupNavigation();
  setupSettings();
  loadDrawings();
  checkAuth();
}

// ---------- CANVAS ----------
function setupCanvas() {
  state.canvas = document.getElementById('pixelCanvas');
  if (!state.canvas) return;
  
  state.ctx = state.canvas.getContext('2d');
  
  const size = Math.min(window.innerWidth - 40, 600);
  state.canvas.width = size;
  state.canvas.height = size;
  
  state.canvas.style.width = size + 'px';
  state.canvas.style.height = size + 'px';
  
  // Mouse events
  state.canvas.addEventListener('mousedown', startDrawing);
  state.canvas.addEventListener('mousemove', draw);
  state.canvas.addEventListener('mouseup', stopDrawing);
  state.canvas.addEventListener('mouseleave', stopDrawing);
  
  // Touch events for mobile
  state.canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startDrawing(e.touches[0]);
  });
  state.canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    draw(e.touches[0]);
  });
  state.canvas.addEventListener('touchend', stopDrawing);
  
  window.addEventListener('resize', () => {
    const newSize = Math.min(window.innerWidth - 40, 600);
    const imageData = state.ctx.getImageData(0, 0, state.canvas.width, state.canvas.height);
    state.canvas.width = newSize;
    state.canvas.height = newSize;
    state.canvas.style.width = newSize + 'px';
    state.canvas.style.height = newSize + 'px';
    state.ctx.putImageData(imageData, 0, 0);
  });
}

function startDrawing(e) {
  state.isDrawing = true;
  state.ctx.beginPath();
  state.ctx.moveTo(e.clientX - state.canvas.getBoundingClientRect().left, e.clientY - state.canvas.getBoundingClientRect().top);
}

function draw(e) {
  if (!state.isDrawing) return;
  const x = e.clientX - state.canvas.getBoundingClientRect().left;
  const y = e.clientY - state.canvas.getBoundingClientRect().top;
  
  state.ctx.lineWidth = state.brushSize;
  state.ctx.lineCap = 'round';
  state.ctx.strokeStyle = state.currentTool === 'eraser' ? '#000000' : state.color;
  state.ctx.lineTo(x, y);
  state.ctx.stroke();
}

function stopDrawing() {
  state.isDrawing = false;
}

// ---------- TOOLS ----------
function setupTools() {
  document.getElementById('toolPencil')?.addEventListener('click', () => {
    state.currentTool = 'pencil';
    highlightTool('toolPencil');
  });
  
  document.getElementById('toolEraser')?.addEventListener('click', () => {
    state.currentTool = 'eraser';
    highlightTool('toolEraser');
  });
  
  document.getElementById('toolFill')?.addEventListener('click', () => {
    state.ctx.fillStyle = state.color;
    state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);
  });
  
  document.getElementById('colorPicker')?.addEventListener('change', (e) => {
    state.color = e.target.value;
  });
  
  document.getElementById('brushSize')?.addEventListener('input', (e) => {
    state.brushSize = parseInt(e.target.value);
  });
  
  highlightTool('toolPencil');
}

function highlightTool(toolId) {
  document.querySelectorAll('#tools button').forEach(b => b.style.background = '#111');
  const btn = document.getElementById(toolId);
  if (btn) btn.style.background = '#333';
}

// ---------- NAVIGATION ----------
function setupNavigation() {
  document.querySelectorAll('#nav button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      navigateTo(page);
    });
  });
  
  document.getElementById('loginBtn')?.addEventListener('click', () => {
    if (state.user) {
      firebase.auth().signOut();
    } else {
      firebase.auth().signInAnonymously();
    }
  });
}

function navigateTo(page) {
  state.currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(page + '-page')?.classList.add('active');
  
  document.querySelectorAll('#nav button[data-page]').forEach(b => b.classList.remove('active'));
  document.querySelector(`#nav button[data-page="${page}"]`)?.classList.add('active');
}

// ---------- SETTINGS ----------
function setupSettings() {
  document.getElementById('saveToCloud')?.addEventListener('click', saveToCloud);
  document.getElementById('exportPNG')?.addEventListener('click', exportPNG);
  document.getElementById('clearCanvas')?.addEventListener('click', clearCanvas);
}

function clearCanvas() {
  if (confirm('Clear canvas?')) {
    state.ctx.fillStyle = '#000000';
    state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);
  }
}

function exportPNG() {
  const link = document.createElement('a');
  link.download = 'pixelpress-' + Date.now() + '.png';
  link.href = state.canvas.toDataURL();
  link.click();
}

async function saveToCloud() {
  if (!state.user) {
    alert('Login to save!');
    return;
  }
  
  try {
    const db = firebase.firestore();
    const data = state.canvas.toDataURL();
    await db.collection('drawings').add({
      userId: state.user.uid,
      data: data,
      timestamp: Date.now()
    });
    alert('Saved!');
    loadDrawings();
  } catch(e) {
    console.error('Save failed:', e);
    alert('Save failed');
  }
}

async function loadDrawings() {
  if (!state.user) return;
  
  try {
    const db = firebase.firestore();
    const snapshot = await db.collection('drawings')
      .where('userId', '==', state.user.uid)
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();
    
    state.drawings = [];
    snapshot.forEach(doc => {
      state.drawings.push({ id: doc.id, ...doc.data() });
    });
    
    renderGallery();
  } catch(e) {
    console.error('Load failed:', e);
  }
}

function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  state.drawings.forEach(d => {
    const img = document.createElement('img');
    img.src = d.data;
    img.addEventListener('click', () => {
      const image = new Image();
      image.src = d.data;
      image.onload = () => {
        state.ctx.drawImage(image, 0, 0);
      };
      navigateTo('editor');
    });
    grid.appendChild(img);
  });
}

// ---------- AUTH ----------
function checkAuth() {
  if (typeof firebase === 'undefined') return;
  
  firebase.auth().onAuthStateChanged(user => {
    state.user = user;
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
      loginBtn.textContent = user ? 'Logout' : 'Login';
    }
    if (user) {
      loadDrawings();
    }
  });
}

// ---------- PWA ----------
function setupPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('PWA Ready'))
        .catch(err => console.log('SW failed:', err));
    });
  }
}

// ---------- START ----------
document.addEventListener('DOMContentLoaded', () => {
  init();
  setupPWA();
});