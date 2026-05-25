document.addEventListener('DOMContentLoaded', () => {
    // ========== DOM elements ==========
    const homePage = document.getElementById('homePage');
    const compressorPage = document.getElementById('compressorPage');
    const resizePage = document.getElementById('resizePage');
    const convertPage = document.getElementById('convertPage');
    const allPages = [homePage, compressorPage, resizePage, convertPage];

    const backButtons = document.querySelectorAll('.back-to-home');
    const heroCta = document.getElementById('heroCta');
    const navHome = document.querySelector('.nav-home');
    const navTools = document.querySelector('.nav-tools');
    const logo = document.querySelector('.logo');
    const themeToggle = document.querySelector('.theme-toggle');
    const userArea = document.getElementById('userArea');

    // Compressor elements
    const dropZoneCompress = document.getElementById('dropZoneCompress');
    const fileInputCompress = document.getElementById('fileInputCompress');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const formatSelectCompress = document.getElementById('formatSelectCompress');
    const compressBtn = document.getElementById('compressBtn');
    const previewGridCompress = document.getElementById('previewGridCompress');

    // Resize elements
    const dropZoneResize = document.getElementById('dropZoneResize');
    const fileInputResize = document.getElementById('fileInputResize');
    const resizeWidth = document.getElementById('resizeWidth');
    const resizeHeight = document.getElementById('resizeHeight');
    const keepAspect = document.getElementById('keepAspect');
    const resizeBtn = document.getElementById('resizeBtn');
    const resizePreview = document.getElementById('resizePreview');
    let originalResizeImage = null;
    let originalResizeWidth = 0;
    let originalResizeHeight = 0;

    // Convert elements
    const dropZoneConvert = document.getElementById('dropZoneConvert');
    const fileInputConvert = document.getElementById('fileInputConvert');
    const formatSelectConvert = document.getElementById('formatSelectConvert');
    const convertBtn = document.getElementById('convertBtn');
    const previewGridConvert = document.getElementById('previewGridConvert');

    // Modal elements
    const loginModal = document.getElementById('loginModal');
    const closeModal = document.querySelector('.close-modal');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const loginUsername = document.getElementById('loginUsername');
    const loginPassword = document.getElementById('loginPassword');
    const regUsername = document.getElementById('regUsername');
    const regPassword = document.getElementById('regPassword');
    const regConfirmPassword = document.getElementById('regConfirmPassword');

    // ========== State ==========
    let selectedCompressFiles = [];
    let selectedConvertFiles = [];
    let currentUser = null;

    // ========== Page helpers ==========
    function showPage(page) {
        allPages.forEach(p => p.classList.remove('active'));
        page.classList.add('active');
    }

    function goHome() {
        showPage(homePage);
    }

    // Navigation
    backButtons.forEach(btn => btn.addEventListener('click', goHome));
    heroCta.addEventListener('click', () => showPage(compressorPage));
    navHome.addEventListener('click', (e) => { e.preventDefault(); goHome(); });
    navTools.addEventListener('click', (e) => {
        e.preventDefault();
        goHome();
        setTimeout(() => document.querySelector('.tools-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    logo.addEventListener('click', goHome);

    // Tool cards
    document.querySelectorAll('.tool-card').forEach(card => {
        card.addEventListener('click', () => {
            const tool = card.dataset.tool;
            if (tool === 'compress') showPage(compressorPage);
            else if (tool === 'resize') showPage(resizePage);
            else if (tool === 'convert') showPage(convertPage);
            else if (tool === 'crop') alert('Crop tool is coming soon!');
        });
    });

    // ========== Dark mode ==========
    function applyTheme(isDark) {
        document.body.classList.toggle('dark', isDark);
        themeToggle.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('pixelpress-theme', isDark ? 'dark' : 'light');
    }
    const storedTheme = localStorage.getItem('pixelpress-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(storedTheme === 'dark' || (!storedTheme && prefersDark));
    themeToggle.addEventListener('click', () => {
        const nowDark = document.body.classList.contains('dark');
        applyTheme(!nowDark);
    });

    // ========== Auth system ==========
    function loadUsers() {
        return JSON.parse(localStorage.getItem('pixelpress-users') || '[]');
    }
    function saveUsers(users) {
        localStorage.setItem('pixelpress-users', JSON.stringify(users));
    }
    function getSession() {
        return JSON.parse(localStorage.getItem('pixelpress-session') || 'null');
    }
    function setSession(user) {
        currentUser = user;
        localStorage.setItem('pixelpress-session', JSON.stringify(user));
        updateUserUI();
    }
    function clearSession() {
        currentUser = null;
        localStorage.removeItem('pixelpress-session');
        updateUserUI();
    }
    function updateUserUI() {
        if (currentUser) {
            userArea.innerHTML = `<span>👤 ${currentUser.username}</span> <a href="#" id="logoutLink" style="margin-left:5px;">Logout</a>`;
            document.getElementById('logoutLink').addEventListener('click', (e) => {
                e.preventDefault();
                clearSession();
            });
        } else {
            userArea.innerHTML = `<a href="#" id="loginLink">Login</a>`;
            document.getElementById('loginLink').addEventListener('click', (e) => {
                e.preventDefault();
                loginModal.classList.add('active');
                loginForm.style.display = 'block';
                registerForm.style.display = 'none';
            });
        }
    }

    // Load session on start
    currentUser = getSession();
    updateUserUI();

    // Modal handlers
    closeModal.addEventListener('click', () => loginModal.classList.remove('active'));
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) loginModal.classList.remove('active');
    });

    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });
    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    // Login
    loginBtn.addEventListener('click', () => {
        const username = loginUsername.value.trim();
        const password = loginPassword.value;
        if (!username || !password) return alert('Please fill all fields.');
        const users = loadUsers();
        const user = users.find(u => u.username === username && u.password === btoa(password));
        if (!user) return alert('Invalid credentials.');
        setSession({ username: user.username });
        loginModal.classList.remove('active');
        loginUsername.value = '';
        loginPassword.value = '';
    });

    // Register
    registerBtn.addEventListener('click', () => {
        const username = regUsername.value.trim();
        const password = regPassword.value;
        const confirm = regConfirmPassword.value;
        if (!username || !password) return alert('Please fill all fields.');
        if (password !== confirm) return alert('Passwords do not match.');
        const users = loadUsers();
        if (users.find(u => u.username === username)) return alert('Username already exists.');
        users.push({ username, password: btoa(password) });
        saveUsers(users);
        alert('Registration successful! Please login.');
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        regUsername.value = '';
        regPassword.value = '';
        regConfirmPassword.value = '';
    });

    // ========== Compressor logic ==========
    function setupDragDrop(dropZone, fileInput, callback) {
        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => callback(e.target.files));
        ['dragenter', 'dragover'].forEach(ev => dropZone.addEventListener(ev, (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        }));
        ['dragleave', 'drop'].forEach(ev => dropZone.addEventListener(ev, (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        }));
        dropZone.addEventListener('drop', (e) => {
            if (e.dataTransfer.files.length) callback(e.dataTransfer.files);
        });
    }

    setupDragDrop(dropZoneCompress, fileInputCompress, (files) => {
        const images = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (!images.length) return alert('Please select image files.');
        selectedCompressFiles = images;
        previewGridCompress.innerHTML = '';
        images.forEach((file, idx) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const card = document.createElement('div');
                card.className = 'preview-card';
                card.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <div class="preview-info">
                        <p><strong>${file.name}</strong></p>
                        <div class="size-row">
                            <span>Original: ${formatBytes(file.size)}</span>
                            <span class="compressed-size" id="compSize-${idx}">—</span>
                        </div>
                    </div>
                `;
                previewGridCompress.appendChild(card);
            };
            reader.readAsDataURL(file);
        });
    });

    qualitySlider.addEventListener('input', () => qualityValue.textContent = qualitySlider.value);
    formatSelectCompress.addEventListener('change', () => {
        if (formatSelectCompress.value === 'image/png') {
            qualitySlider.disabled = true;
            qualitySlider.style.opacity = '0.5';
        } else {
            qualitySlider.disabled = false;
            qualitySlider.style.opacity = '1';
        }
    });

    compressBtn.addEventListener('click', () => {
        if (!selectedCompressFiles.length) return alert('Add images first.');
        compressBtn.disabled = true;
        compressBtn.textContent = 'Compressing...';
        const quality = qualitySlider.value / 100;
        const mime = formatSelectCompress.value;
        let completed = 0;

        selectedCompressFiles.forEach((file, index) => {
            compressImage(file, quality, mime, (blob) => {
                const url = URL.createObjectURL(blob);
                const card = previewGridCompress.children[index];
                if (!card) return;
                card.querySelector('img').src = url;
                const compSpan = card.querySelector(`#compSize-${index}`);
                if (compSpan) compSpan.textContent = formatBytes(blob.size);
                if (!card.querySelector('.download-btn')) {
                    const btn = document.createElement('button');
                    btn.className = 'download-btn';
                    btn.textContent = 'Download';
                    btn.addEventListener('click', () => {
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `compressed_${file.name.replace(/\.[^/.]+$/, '')}.${mime.split('/')[1]}`;
                        a.click();
                    });
                    card.appendChild(btn);
                }
                completed++;
                if (completed === selectedCompressFiles.length) {
                    compressBtn.disabled = false;
                    compressBtn.textContent = 'Compress All Images';
                }
            });
        });
    });

    function compressImage(file, quality, mime, callback) {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(blob => callback(blob), mime, quality);
        };
    }

    // ========== Resize logic ==========
    setupDragDrop(dropZoneResize, fileInputResize, (files) => {
        if (!files.length) return;
        const file = files[0];
        if (!file.type.startsWith('image/')) return alert('Please select an image.');
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                originalResizeImage = img;
                originalResizeWidth = img.width;
                originalResizeHeight = img.height;
                resizeWidth.value = img.width;
                resizeHeight.value = img.height;
                showResizePreview(img);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });

    function showResizePreview(img) {
        resizePreview.innerHTML = `<img src="${img.src}" alt="preview">`;
    }

    resizeWidth.addEventListener('input', () => {
        if (keepAspect.checked && originalResizeImage) {
            const ratio = originalResizeWidth / originalResizeHeight;
            resizeHeight.value = Math.round(resizeWidth.value / ratio);
        }
    });
    resizeHeight.addEventListener('input', () => {
        if (keepAspect.checked && originalResizeImage) {
            const ratio = originalResizeWidth / originalResizeHeight;
            resizeWidth.value = Math.round(resizeHeight.value * ratio);
        }
    });

    resizeBtn.addEventListener('click', () => {
        if (!originalResizeImage) return alert('Please upload an image first.');
        const width = parseInt(resizeWidth.value) || originalResizeWidth;
        const height = parseInt(resizeHeight.value) || originalResizeHeight;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(originalResizeImage, 0, 0, width, height);
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'resized_image.png';
            a.click();
        });
    });

    // ========== Convert logic ==========
    setupDragDrop(dropZoneConvert, fileInputConvert, (files) => {
        const images = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (!images.length) return alert('Please select image files.');
        selectedConvertFiles = images;
        previewGridConvert.innerHTML = '';
        images.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const card = document.createElement('div');
                card.className = 'preview-card';
                card.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <div class="preview-info">
                        <p><strong>${file.name}</strong></p>
                        <p>Format: ${file.type}</p>
                    </div>
                `;
                previewGridConvert.appendChild(card);
            };
            reader.readAsDataURL(file);
        });
    });

    convertBtn.addEventListener('click', () => {
        if (!selectedConvertFiles.length) return alert('Add images first.');
        const targetMime = formatSelectConvert.value;
        let completed = 0;
        selectedConvertFiles.forEach((file, idx) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                canvas.toBlob(blob => {
                    const url = URL.createObjectURL(blob);
                    const card = previewGridConvert.children[idx];
                    if (card) {
                        card.querySelector('img').src = url;
                        if (!card.querySelector('.download-btn')) {
                            const btn = document.createElement('button');
                            btn.className = 'download-btn';
                            btn.textContent = 'Download';
                            btn.addEventListener('click', () => {
                                const a = document.createElement('a');
                                a.href = url;
                                const ext = targetMime.split('/')[1];
                                a.download = `converted_${file.name.replace(/\.[^/.]+$/, '')}.${ext}`;
                                a.click();
                            });
                            card.appendChild(btn);
                        }
                    }
                    completed++;
                }, targetMime);
            };
        });
    });

    // Utility
    function formatBytes(bytes, decimals = 1) {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    }

    // Initial page load
    showPage(homePage);
});