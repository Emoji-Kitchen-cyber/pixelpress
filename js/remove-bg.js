// js/remove-bg.js
const RemoveBG = {
    filesData: [],
    MAX_FILES: 10,
    isLibraryLoaded: false,
    removeBackgroundFn: null,

    init() {
        console.log('%c[RemoveBG] Production v1.0 initialized', 'color:#6366f1;font-weight:bold');
        this.setupListeners();
        this.loadLibrary();
        this.checkCompatibility();
    },

    checkCompatibility() {
        if (typeof WebAssembly === 'undefined') {
            this.showToast('WebAssembly not supported on this browser.', 'error');
        }
    },

    async loadLibrary() {
        const status = document.getElementById('status');
        try {
            const module = await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.8/+esm');
            this.removeBackgroundFn = module.removeBackground;
            this.isLibraryLoaded = true;
            status.textContent = '✅ AI Ready';
            console.log('%c[RemoveBG] @imgly/background-removal loaded successfully', 'color:#22c55e');
        } catch (e) {
            console.error(e);
            status.textContent = '⚠️ AI Model Failed';
        }
    },

    setupListeners() {
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');

        uploadArea.addEventListener('click', () => fileInput.click());
        
        uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('dragover'); });
        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
        uploadArea.addEventListener('drop', e => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        fileInput.addEventListener('change', e => this.handleFiles(e.target.files));

        // Slider
        let dragging = false;
        const divider = document.getElementById('slider-divider');
        
        divider.addEventListener('mousedown', () => dragging = true);
        window.addEventListener('mouseup', () => dragging = false);
        window.addEventListener('mousemove', e => {
            if (!dragging) return;
            const rect = document.getElementById('before-after').getBoundingClientRect();
            let pos = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
            document.getElementById('before-img').style.width = pos + '%';
            document.getElementById('after-img').style.left = pos + '%';
            divider.style.left = pos + '%';
        });
    },

    handleFiles(fileList) {
        Array.from(fileList).forEach(file => {
            if (!file.type.startsWith('image/') || this.filesData.length >= this.MAX_FILES) return;

            const reader = new FileReader();
            reader.onload = ev => {
                const img = new Image();
                img.onload = () => {
                    this.filesData.push({
                        id: Date.now(),
                        name: file.name,
                        originalUrl: ev.target.result,
                        processedUrl: null,
                        blob: null
                    });
                    this.renderFiles();
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });
    },

    renderFiles() {
        const container = document.getElementById('files-list');
        container.innerHTML = '';

        this.filesData.forEach((file, i) => {
            const div = document.createElement('div');
            div.className = 'file-card';
            div.innerHTML = `
                <div class="preview-container">
                    <img src="${file.originalUrl}" class="preview">
                    <div class="processing-overlay" id="overlay-${file.id}">
                        <div>Processing with AI...</div>
                        <div class="progress-bar"><div class="progress" style="width:0%"></div></div>
                    </div>
                </div>
                <div class="controls">
                    <div style="font-size:13px;margin-bottom:8px;">${file.name}</div>
                    <button onclick="RemoveBG.processSingle(${i})" class="btn-primary" style="width:100%;margin-bottom:6px;">Remove Background</button>
                    \( {file.processedUrl ? `<button onclick="RemoveBG.showResult( \){i})" class="btn-secondary" style="width:100%">View Result</button>` : ''}
                </div>
            `;
            container.appendChild(div);
        });

        document.getElementById('process-all-btn').disabled = this.filesData.length === 0;
    },

    async processSingle(index) {
        const file = this.filesData[index];
        if (!file || file.processedUrl) return;

        const overlay = document.getElementById(`overlay-${file.id}`);
        overlay.style.display = 'flex';

        try {
            let resultBlob;

            if (this.isLibraryLoaded && this.removeBackgroundFn) {
                const img = new Image();
                img.src = file.originalUrl;
                await new Promise(r => img.onload = r);

                resultBlob = await this.removeBackgroundFn(img, {
                    model: 'isnet',
                    output: { format: 'image/png' }
                });
            } else {
                // Fallback
                resultBlob = await this.simpleFallback(file.originalUrl);
            }

            file.processedUrl = URL.createObjectURL(resultBlob);
            file.blob = resultBlob;

            this.renderFiles();

        } catch (err) {
            console.error(err);
            this.showToast('Processing failed for ' + file.name, 'error');
        } finally {
            overlay.style.display = 'none';
        }
    },

    async processAll() {
        for (let i = 0; i < this.filesData.length; i++) {
            if (!this.filesData[i].processedUrl) {
                await this.processSingle(i);
            }
        }
        document.getElementById('download-all-btn').style.display = 'inline-block';
    },

    async simpleFallback(dataUrl) {
        return new Promise(resolve => {
            const canvas = document.createElement('canvas');
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.getContext('2d').drawImage(img, 0, 0);
                canvas.toBlob(resolve, 'image/png', 0.95);
            };
            img.src = dataUrl;
        });
    },

    showResult(index) {
        const file = this.filesData[index];
        document.getElementById('current-file-name').textContent = file.name;
        document.getElementById('original-preview').src = file.originalUrl;
        document.getElementById('processed-preview').src = file.processedUrl;
        document.getElementById('result-panel').style.display = 'block';
    },

    closeResult() {
        document.getElementById('result-panel').style.display = 'none';
    },

    downloadCurrent() {
        const index = this.filesData.findIndex(f => f.processedUrl);
        if (index === -1) return;
        const file = this.filesData[index];
        const a = document.createElement('a');
        a.href = file.processedUrl;
        a.download = file.name.replace(/\.\w+/, '') + '-nobg.png';
        a.click();
    },

    async downloadAll() {
        const zip = new JSZip();
        this.filesData.forEach(file => {
            if (file.blob) {
                zip.file(file.name.replace(/\.\w+/, '') + '-nobg.png', file.blob);
            }
        });
        const blob = await zip.generateAsync({type:"blob"});
        saveAs(blob, `removed-backgrounds-${Date.now()}.zip`);
    },

    clearAll() {
        this.filesData.forEach(f => { if (f.processedUrl) URL.revokeObjectURL(f.processedUrl); });
        this.filesData = [];
        this.renderFiles();
        document.getElementById('download-all-btn').style.display = 'none';
    },

    showToast(msg, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.style.borderLeftColor = type === 'error' ? '#ef4444' : '#22c55e';
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 3000);
    }
};

window.onload = () => RemoveBG.init();
window.RemoveBG = RemoveBG;