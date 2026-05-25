document.addEventListener('DOMContentLoaded', () => {
    // ========== DOM ==========
    const homePage = document.getElementById('homePage');
    const compressorPage = document.getElementById('compressorPage');
    const resizePage = document.getElementById('resizePage');
    const cropPage = document.getElementById('cropPage');
    const convertPage = document.getElementById('convertPage');
    const allPages = [homePage, compressorPage, resizePage, cropPage, convertPage];

    const backButtons = document.querySelectorAll('.back-to-home');
    const heroCta = document.getElementById('heroCta');
    const navHome = document.querySelector('.nav-home');
    const navTools = document.querySelector('.nav-tools');
    const logo = document.querySelector('.logo');
    const themeToggle = document.querySelector('.theme-toggle');
    const userArea = document.getElementById('userArea');

    // Compressor
    const dropZoneCompress = document.getElementById('dropZoneCompress');
    const fileInputCompress = document.getElementById('fileInputCompress');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const formatSelectCompress = document.getElementById('formatSelectCompress');
    const compressBtn = document.getElementById('compressBtn');
    const previewGridCompress = document.getElementById('previewGridCompress');

    // Resize
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

    // Crop
    const dropZoneCrop = document.getElementById('dropZoneCrop');
    const fileInputCrop = document.getElementById('fileInputCrop');
    const cropCanvas = document.getElementById('cropCanvas');
    const cropBox = document.getElementById('cropBox');
    const cropContainer = document.getElementById('cropContainer');
    const cropBtn = document.getElementById('cropBtn');
    let cropImage = null;
    let cropStartX, cropStartY;
    let isDragging = false;
    let isMoving = false;
    let startMoveX, startMoveY;
    let cropLeft = 50, cropTop = 50, cropWidth = 200, cropHeight = 200;

    // Convert
    const dropZoneConvert = document.getElementById('dropZoneConvert');
    const fileInputConvert = document.getElementById('fileInputConvert');
    const formatSelectConvert = document.getElementById('formatSelectConvert');
    const convertBtn = document.getElementById('convertBtn');
    const previewGridConvert = document.getElementById('previewGridConvert');

    // Modal
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

    // State
    let selectedCompressFiles = [];
    let selectedConvertFiles = [];
    let currentUser = null;

    // ========== Page helpers ==========
    function showPage(page) {
        allPages.forEach(p => p.classList.remove('active'));
        page.classList.add('active');
    }
    function goHome() { showPage(homePage); }

    backButtons.forEach(btn => btn.addEventListener('click', goHome));
    heroCta.addEventListener('click', () => showPage(compressorPage));
    navHome.addEventListener('click', e => { e.preventDefault(); goHome(); });
    navTools.addEventListener('click', e => {
        e.preventDefault();
        goHome();
        setTimeout(() => document.querySelector('.tools-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    logo.addEventListener('click', goHome);

    document.querySelectorAll('.tool-card').forEach(card => {
        card.addEventListener('click', () => {
            const tool = card.dataset.tool;
            if (tool === 'compress') showPage(compressorPage);
            else if (tool === 'resize') showPage(resizePage);
            else if (tool === 'crop') showPage(cropPage);
            else if (tool === 'convert') showPage(convertPage);
        });
    });

    // ========== Dark mode ==========
    function applyTheme(isDark) {
        document.body.classList.toggle('dark', isDark);
        themeToggle.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('pixelpress-theme', isDark ? 'dark' : 'light');
    }
    const stored = localStorage.getItem('pixelpress-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(stored === 'dark' || (!stored && prefersDark));
    themeToggle.addEventListener('click', () => {
        applyTheme(!document.body.classList.contains('dark'));
    });

    // ========== Auth ==========
    function loadUsers() { return JSON.parse(localStorage.getItem('pixelpress-users') || '[]'); }
    function saveUsers(users) { localStorage.setItem('pixelpress-users', JSON.stringify(users)); }
    function getSession() { return JSON.parse(localStorage.getItem('pixelpress-session') || 'null'); }
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
                e.preventDefault(); clearSession();
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
    currentUser = getSession();
    updateUserUI();

    closeModal.addEventListener('click', () => loginModal.classList.remove('active'));
    window.addEventListener('click', e => { if (e.target === loginModal) loginModal.classList.remove('active'); });
    showRegister.addEventListener('click', e => { e.preventDefault(); loginForm.style.display = 'none'; registerForm.style.display = 'block'; });
    showLogin.addEventListener('click', e => { e.preventDefault(); registerForm.style.display = 'none'; loginForm.style.display = 'block'; });

    loginBtn.addEventListener('click', () => {
        const u = loginUsername.value.trim(), p = loginPassword.value;
        if (!u || !p) return alert('Fill all fields.');
        const users = loadUsers();
        const user = users.find(x => x.username === u && x.password === btoa(p));
        if (!user) return alert('Invalid credentials.');
        setSession({ username: user.username });
        loginModal.classList.remove('active');
        loginUsername.value = loginPassword.value = '';
    });
    registerBtn.addEventListener('click', () => {
        const u = regUsername.value.trim(), p = regPassword.value, c = regConfirmPassword.value;
        if (!u || !p) return alert('Fill all fields.');
        if (p !== c) return alert('Passwords do not match.');
        const users = loadUsers();
        if (users.find(x => x.username === u)) return alert('Username exists.');
        users.push({ username: u, password: btoa(p) });
        saveUsers(users);
        alert('Registered! Please login.');
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        regUsername.value = regPassword.value = regConfirmPassword.value = '';
    });

    // ========== Drag & drop helper ==========
    function setupDragDrop(dropZone, fileInput, callback) {
        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', e => callback(e.target.files));
        ['dragenter', 'dragover'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.add('drag-over'); }));
        ['dragleave', 'drop'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.remove('drag-over'); }));
        dropZone.addEventListener('drop', e => { if (e.dataTransfer.files.length) callback(e.dataTransfer.files); });
    }

    // ========== Compress ==========
    setupDragDrop(dropZoneCompress, fileInputCompress, files => {
        const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (!imgs.length) return alert('No images.');
        selectedCompressFiles = imgs;
        previewGridCompress.innerHTML = '';
        imgs.forEach((file, i) => {
            const reader = new FileReader();
            reader.onload = e => {
                const card = document.createElement('div');
                card.className = 'preview-card';
                card.innerHTML = `<img src="${e.target.result}" alt="${file.name}"><div class="preview-info"><p><strong>${file.name}</strong></p><div class="size-row"><span>Original: ${formatBytes(file.size)}</span><span id="compSize-${i}">—</span></div></div>`;
                previewGridCompress.appendChild(card);
            };
            reader.readAsDataURL(file);
        });
    });
    qualitySlider.addEventListener('input', () => qualityValue.textContent = qualitySlider.value);
    formatSelectCompress.addEventListener('change', () => {
        qualitySlider.disabled = formatSelectCompress.value === 'image/png';
        qualitySlider.style.opacity = formatSelectCompress.value === 'image/png' ? '0.5' : '1';
    });
    compressBtn.addEventListener('click', () => {
        if (!selectedCompressFiles.length) return alert('Add images.');
        compressBtn.disabled = true;
        compressBtn.textContent = 'Compressing...';
        const q = qualitySlider.value / 100, mime = formatSelectCompress.value;
        let done = 0;
        selectedCompressFiles.forEach((file, i) => {
            compressImage(file, q, mime, blob => {
                const url = URL.createObjectURL(blob);
                const card = previewGridCompress.children[i];
                card.querySelector('img').src = url;
                const span = card.querySelector(`#compSize-${i}`);
                if (span) span.textContent = formatBytes(blob.size);
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
                done++;
                if (done === selectedCompressFiles.length) {
                    compressBtn.disabled = false;
                    compressBtn.textContent = 'Compress All Images';
                }
            });
        });
    });
    function compressImage(file, quality, mime, cb) {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width; canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0);
            canvas.toBlob(blob => cb(blob), mime, quality);
        };
    }

    // ========== Resize ==========
    setupDragDrop(dropZoneResize, fileInputResize, files => {
        if (!files.length) return;
        const file = files[0];
        if (!file.type.startsWith('image/')) return alert('Image only.');
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => {
                originalResizeImage = img;
                originalResizeWidth = img.width;
                originalResizeHeight = img.height;
                resizeWidth.value = img.width;
                resizeHeight.value = img.height;
                resizePreview.innerHTML = `<img src="${img.src}" alt="preview">`;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
    resizeWidth.addEventListener('input', () => {
        if (keepAspect.checked && originalResizeImage) {
            resizeHeight.value = Math.round(resizeWidth.value / (originalResizeWidth / originalResizeHeight));
        }
    });
    resizeHeight.addEventListener('input', () => {
        if (keepAspect.checked && originalResizeImage) {
            resizeWidth.value = Math.round(resizeHeight.value * (originalResizeWidth / originalResizeHeight));
        }
    });
    resizeBtn.addEventListener('click', () => {
        if (!originalResizeImage) return alert('Upload image.');
        const w = parseInt(resizeWidth.value) || originalResizeWidth;
        const h = parseInt(resizeHeight.value) || originalResizeHeight;
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(originalResizeImage, 0, 0, w, h);
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'resized.png'; a.click();
        });
    });

    // ========== CROP (working!) ==========
    function resetCropBox() {
        cropLeft = 50; cropTop = 50; cropWidth = 200; cropHeight = 200;
        updateCropBox();
    }
    function updateCropBox() {
        cropBox.style.left = cropLeft + 'px';
        cropBox.style.top = cropTop + 'px';
        cropBox.style.width = cropWidth + 'px';
        cropBox.style.height = cropHeight + 'px';
    }
    setupDragDrop(dropZoneCrop, fileInputCrop, files => {
        if (!files.length) return;
        const file = files[0];
        if (!file.type.startsWith('image/')) return alert('Image only.');
        const reader = new FileReader();
        reader.onload = e => {
            cropImage = new Image();
            cropImage.onload = () => {
                cropCanvas.width = cropImage.width;
                cropCanvas.height = cropImage.height;
                const ctx = cropCanvas.getContext('2d');
                ctx.drawImage(cropImage, 0, 0);
                // reset crop box to fit inside image
                cropLeft = 10;
                cropTop = 10;
                cropWidth = Math.min(300, cropImage.width - 20);
                cropHeight = Math.min(300, cropImage.height - 20);
                updateCropBox();
            };
            cropImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });

    // Crop box dragging / resizing
    cropBox.addEventListener('mousedown', (e) => {
        if (e.target === cropBox) {
            isMoving = true;
            startMoveX = e.clientX;
            startMoveY = e.clientY;
            const rect = cropBox.getBoundingClientRect();
            cropLeft = rect.left - cropContainer.getBoundingClientRect().left;
            cropTop = rect.top - cropContainer.getBoundingClientRect().top;
            cropWidth = rect.width;
            cropHeight = rect.height;
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', () => {
                isMoving = false;
                document.removeEventListener('mousemove', onMove);
            }, { once: true });
        }
    });
    function onMove(e) {
        if (!isMoving) return;
        const dx = e.clientX - startMoveX;
        const dy = e.clientY - startMoveY;
        cropLeft = Math.max(0, Math.min(cropImage.width - cropWidth, cropLeft + dx));
        cropTop = Math.max(0, Math.min(cropImage.height - cropHeight, cropTop + dy));
        updateCropBox();
        startMoveX = e.clientX;
        startMoveY = e.clientY;
    }

    // Also allow drawing new crop box on canvas
    cropCanvas.addEventListener('mousedown', (e) => {
        if (e.target === cropBox) return; // ignore if clicked on box itself
        const rect = cropCanvas.getBoundingClientRect();
        cropStartX = e.clientX - rect.left;
        cropStartY = e.clientY - rect.top;
        isDragging = true;
        document.addEventListener('mousemove', onDraw);
        document.addEventListener('mouseup', () => {
            isDragging = false;
            document.removeEventListener('mousemove', onDraw);
        }, { once: true });
    });
    function onDraw(e) {
        if (!isDragging || !cropImage) return;
        const rect = cropCanvas.getBoundingClientRect();
        const curX = e.clientX - rect.left;
        const curY = e.clientY - rect.top;
        cropLeft = Math.min(cropStartX, curX);
        cropTop = Math.min(cropStartY, curY);
        cropWidth = Math.abs(curX - cropStartX);
        cropHeight = Math.abs(curY - cropStartY);
        // clamp
        cropLeft = Math.max(0, cropLeft);
        cropTop = Math.max(0, cropTop);
        if (cropLeft + cropWidth > cropImage.width) cropWidth = cropImage.width - cropLeft;
        if (cropTop + cropHeight > cropImage.height) cropHeight = cropImage.height - cropTop;
        updateCropBox();
    }

    cropBtn.addEventListener('click', () => {
        if (!cropImage) return alert('Upload an image first.');
        const canvas = document.createElement('canvas');
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(cropImage, cropLeft, cropTop, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cropped_image.png';
            a.click();
        });
    });

    // ========== Convert ==========
    setupDragDrop(dropZoneConvert, fileInputConvert, files => {
        const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (!imgs.length) return alert('No images.');
        selectedConvertFiles = imgs;
        previewGridConvert.innerHTML = '';
        imgs.forEach((file, i) => {
            const reader = new FileReader();
            reader.onload = e => {
                const card = document.createElement('div');
                card.className = 'preview-card';
                card.innerHTML = `<img src="${e.target.result}" alt="${file.name}"><div class="preview-info"><p><strong>${file.name}</strong></p><p>Format: ${file.type}</p></div>`;
                previewGridConvert.appendChild(card);
            };
            reader.readAsDataURL(file);
        });
    });
    convertBtn.addEventListener('click', () => {
        if (!selectedConvertFiles.length) return alert('Add images.');
        const mime = formatSelectConvert.value;
        selectedConvertFiles.forEach((file, i) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width; canvas.height = img.height;
                canvas.getContext('2d').drawImage(img, 0, 0);
                canvas.toBlob(blob => {
                    const url = URL.createObjectURL(blob);
                    const card = previewGridConvert.children[i];
                    card.querySelector('img').src = url;
                    if (!card.querySelector('.download-btn')) {
                        const btn = document.createElement('button');
                        btn.className = 'download-btn';
                        btn.textContent = 'Download';
                        btn.addEventListener('click', () => {
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `converted_${file.name.replace(/\.[^/.]+$/, '')}.${mime.split('/')[1]}`;
                            a.click();
                        });
                        card.appendChild(btn);
                    }
                }, mime);
            };
        });
    });

    function formatBytes(bytes, decimals = 1) {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    }

    showPage(homePage);
});