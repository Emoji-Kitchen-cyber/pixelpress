document.addEventListener('DOMContentLoaded', () => {
    // ---------- DOM elements ----------
    const homePage = document.getElementById('homePage');
    const compressorPage = document.getElementById('compressorPage');
    const backToHomeBtn = document.getElementById('backToHome');
    const heroCta = document.getElementById('heroCta');
    const navHome = document.querySelector('.nav-home');
    const navTools = document.querySelector('.nav-tools');
    const logo = document.querySelector('.logo');
    const themeToggle = document.querySelector('.theme-toggle');

    // Compressor elements
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const compressBtn = document.getElementById('compressBtn');
    const previewGrid = document.getElementById('previewGrid');

    // ---------- State ----------
    let selectedFiles = [];

    // ---------- Page switching ----------
    function showPage(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        page.classList.add('active');
    }

    function goHome() {
        showPage(homePage);
    }

    function goCompressor() {
        showPage(compressorPage);
    }

    // Event listeners for navigation
    backToHomeBtn.addEventListener('click', goHome);
    heroCta.addEventListener('click', goCompressor);
    navHome.addEventListener('click', (e) => {
        e.preventDefault();
        goHome();
    });
    navTools.addEventListener('click', (e) => {
        e.preventDefault();
        goHome();
        // Scroll to tools section smoothly
        setTimeout(() => {
            document.querySelector('.tools-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    });
    logo.addEventListener('click', goHome);

    // Tool card clicks
    document.querySelectorAll('.tool-card').forEach(card => {
        card.addEventListener('click', () => {
            const tool = card.dataset.tool;
            if (tool === 'compress') {
                goCompressor();
            } else {
                alert('✨ This tool is coming soon! Only Image Compressor is live right now.');
            }
        });
    });

    // ---------- Dark mode with local storage ----------
    const applyTheme = (isDark) => {
        document.body.classList.toggle('dark', isDark);
        themeToggle.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('pixelpress-theme', isDark ? 'dark' : 'light');
    };

    const stored = localStorage.getItem('pixelpress-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored ? stored === 'dark' : prefersDark;
    applyTheme(isDark);

    themeToggle.addEventListener('click', () => {
        const nowDark = document.body.classList.contains('dark');
        applyTheme(!nowDark);
    });

    // ---------- File handling ----------
    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Drag & drop
    ['dragenter', 'dragover'].forEach(event => {
        dropZone.addEventListener(event, (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(event => {
        dropZone.addEventListener(event, (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt.files.length) {
            handleFiles(dt.files);
        }
    });

    function handleFiles(fileList) {
        const images = Array.from(fileList).filter(f => f.type.startsWith('image/'));
        if (images.length === 0) {
            alert('Please select valid image files.');
            return;
        }
        selectedFiles = images;
        previewGrid.innerHTML = '';
        selectedFiles.forEach((file, idx) => {
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
                previewGrid.appendChild(card);
            };
            reader.readAsDataURL(file);
        });
    }

    // ---------- Quality slider ----------
    qualitySlider.addEventListener('input', () => {
        qualityValue.textContent = qualitySlider.value;
    });

    // ---------- Compression ----------
    compressBtn.addEventListener('click', () => {
        if (!selectedFiles.length) {
            alert('Please add at least one image.');
            return;
        }

        compressBtn.disabled = true;
        compressBtn.textContent = 'Compressing...';
        const quality = qualitySlider.value / 100;
        let completed = 0;

        selectedFiles.forEach((file, index) => {
            compressImage(file, quality, (blob) => {
                const url = URL.createObjectURL(blob);
                const card = previewGrid.children[index];
                if (!card) return;

                // Update preview image
                const img = card.querySelector('img');
                img.src = url;

                // Update compressed size
                const compSpan = card.querySelector(`#compSize-${index}`);
                if (compSpan) {
                    compSpan.textContent = formatBytes(blob.size);
                }

                // Add download button
                if (!card.querySelector('.download-btn')) {
                    const btn = document.createElement('button');
                    btn.className = 'download-btn';
                    btn.textContent = 'Download';
                    btn.addEventListener('click', () => {
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `compressed_${file.name.replace(/\.[^/.]+$/, '')}.jpg`;
                        a.click();
                    });
                    card.appendChild(btn);
                }

                completed++;
                if (completed === selectedFiles.length) {
                    compressBtn.disabled = false;
                    compressBtn.textContent = 'Compress All Images';
                }
            });
        });
    });

    function compressImage(file, quality, callback) {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(blob => {
                callback(blob);
            }, 'image/jpeg', quality);
        };
    }

    function formatBytes(bytes, decimals = 1) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
});