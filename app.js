/* ============================================
   PixelPress Pro – Main Application Shell
   ============================================ */

import { initializeAuth, signIn, signUp, signOut, onAuthChange } from './auth.js';
import { setupDragDrop, formatBytes, showSpinner, hideSpinner, revokeURLs } from './utils/helpers.js';
import { initCompressor } from './modules/compressor.js';
import { initResizer } from './modules/resizer.js';
import { initCropper } from './modules/cropper.js';
import { initConverter } from './modules/converter.js';
import { initWatermark } from './modules/watermark.js';
import { initRotate } from './modules/rotate.js';
import { initUpscale } from './modules/upscale.js';
import { initBulkZip } from './modules/bulkZip.js';
import { initExifRemover } from './modules/exifRemover.js';
import { HistoryPanel } from './modules/history.js';
import { FileQueue } from './modules/fileQueue.js';

// ---------- State ----------
let currentUser = null;
const historyPanel = new HistoryPanel();
const fileQueue = new FileQueue();

// ---------- DOM references ----------
const homePage = document.getElementById('homePage');
const appMain = document.getElementById('appMain');
const loginModal = document.getElementById('loginModal');
const userArea = document.getElementById('userArea');
const themeToggle = document.querySelector('.theme-toggle');
const globalSpinner = document.getElementById('globalSpinner');

// ---------- Tool configurations ----------
const tools = [
  { id: 'compress', icon: '🗜️', label: 'Compress', desc: 'Reduce file size with quality control' },
  { id: 'resize',  icon: '📏', label: 'Resize', desc: 'Change dimensions for any platform' },
  { id: 'crop',    icon: '✂️', label: 'Crop', desc: 'Cut and frame your image perfectly' },
  { id: 'convert', icon: '🔄', label: 'Convert', desc: 'JPEG, PNG, WebP, and more' },
  { id: 'watermark', icon: '💧', label: 'Watermark', desc: 'Add text or logo overlay' },
  { id: 'rotate',  icon: '🔃', label: 'Rotate & Flip', desc: 'Adjust orientation' },
  { id: 'upscale', icon: '🔍', label: 'AI Upscale', desc: 'Enhance resolution (simulated)' },
  { id: 'exif',    icon: '🧹', label: 'Remove EXIF', desc: 'Strip metadata and location' },
  { id: 'bulkzip', icon: '📦', label: 'Bulk ZIP', desc: 'Download all as ZIP' },
];

// ---------- SPA Page Management ----------
function navigateTo(toolId) {
  // Remove any existing tool page
  const existing = document.querySelector('.tool-page');
  if (existing) existing.remove();
  homePage.classList.add('hidden');

  if (!toolId || toolId === 'home') {
    homePage.classList.remove('hidden');
    return;
  }

  // Create tool page container
  const page = document.createElement('div');
  page.className = 'tool-page page active';
  page.id = `tool-${toolId}`;
  page.innerHTML = `
    <div class="container">
      <button class="back-btn">← Back to Home</button>
      <div id="toolContent"></div>
    </div>
  `;
  appMain.appendChild(page);
  page.querySelector('.back-btn').addEventListener('click', () => navigateTo('home'));

  const content = page.querySelector('#toolContent');
  // Initialize the specific tool module
  switch (toolId) {
    case 'compress': initCompressor(content, fileQueue, historyPanel); break;
    case 'resize': initResizer(content); break;
    case 'crop': initCropper(content); break;
    case 'convert': initConverter(content, fileQueue); break;
    case 'watermark': initWatermark(content); break;
    case 'rotate': initRotate(content); break;
    case 'upscale': initUpscale(content); break;
    case 'exif': initExifRemover(content); break;
    case 'bulkzip': initBulkZip(content, fileQueue); break;
  }
}

// ---------- Render Home Tool Cards ----------
function renderToolCards() {
  const grid = document.getElementById('toolsGrid');
  if (!grid) return;
  grid.innerHTML = tools.map(tool => `
    <div class="tool-card" data-tool="${tool.id}" tabindex="0" role="button" aria-label="${tool.label} tool">
      <div class="tool-icon">${tool.icon}</div>
      <h3>${tool.label}</h3>
      <p>${tool.desc}</p>
    </div>
  `).join('');

  grid.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('click', () => navigateTo(card.dataset.tool));
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter') navigateTo(card.dataset.tool); });
  });
}

// ---------- Dark Mode ----------
function applyTheme(isDark) {
  document.body.classList.toggle('dark', isDark);
  themeToggle.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('pixelpress-theme', isDark ? 'dark' : 'light');
}
const storedTheme = localStorage.getItem('pixelpress-theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(storedTheme === 'dark' || (!storedTheme && prefersDark));
themeToggle.addEventListener('click', () => {
  applyTheme(!document.body.classList.contains('dark'));
});

// ---------- Auth UI & Logic ----------
async function updateUserUI() {
  if (currentUser) {
    userArea.innerHTML = `<span>👤 ${currentUser.email}</span> <a href="#" id="logoutLink">Logout</a>`;
    document.getElementById('logoutLink').addEventListener('click', async (e) => {
      e.preventDefault();
      await signOut();
    });
  } else {
    userArea.innerHTML = `<a href="#" id="loginLink">Login</a>`;
    document.getElementById('loginLink').addEventListener('click', (e) => {
      e.preventDefault();
      openLoginModal();
    });
  }
}

function openLoginModal() {
  loginModal.classList.add('active');
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
}

function closeLoginModal() {
  loginModal.classList.remove('active');
}

// Firebase auth state observer
initializeAuth(); // called once
onAuthChange(async (user) => {
  currentUser = user;
  updateUserUI();
  if (user) closeLoginModal();
});

// Modal events
document.querySelector('.close-modal').addEventListener('click', closeLoginModal);
window.addEventListener('click', (e) => { if (e.target === loginModal) closeLoginModal(); });

document.getElementById('showRegister').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
});
document.getElementById('showLogin').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'block';
});

document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) return alert('Please fill all fields.');
  try {
    await signIn(email, password);
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById('registerBtn').addEventListener('click', async () => {
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  if (!email || !password) return alert('Please fill all fields.');
  try {
    await signUp(email, password);
    alert('Registration successful! You are now logged in.');
  } catch (err) {
    alert(err.message);
  }
});

// ---------- Keyboard Shortcuts ----------
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault();
    historyPanel.undo();
  } else if (e.ctrlKey && e.key === 'y') {
    e.preventDefault();
    historyPanel.redo();
  } else if (e.key === 'Escape') {
    closeLoginModal();
  }
});

// ---------- PWA Registration ----------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/js/pwa/sw.js').then(() => {
      console.log('Service worker registered.');
    }).catch(err => console.error('SW registration failed:', err));
  });
}

// ---------- Global Helpers (exported for modules) ----------
window.showSpinner = showSpinner;
window.hideSpinner = hideSpinner;
window.revokeURLs = revokeURLs;
window.fileQueue = fileQueue;
window.historyPanel = historyPanel;
window.formatBytes = formatBytes;

// ---------- Initialization ----------
renderToolCards();
document.getElementById('heroCta')?.addEventListener('click', () => navigateTo('compress'));
document.querySelector('.nav-home')?.addEventListener('click', (e) => { e.preventDefault(); navigateTo('home'); });
document.querySelector('.nav-tools')?.addEventListener('click', (e) => {
  e.preventDefault();
  navigateTo('home');
  setTimeout(() => document.querySelector('.tools-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
});
document.getElementById('homeLogo')?.addEventListener('click', () => navigateTo('home'));
updateUserUI();