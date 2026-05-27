// js/remove-bg.js - FIXED AI LOADING
const RemoveBG = {
    filesData: [],
    MAX_FILES: 10,
    removeBackgroundFn: null,
    isReady: false,

    async init() {
        console.log('%c[RemoveBG] Starting...', 'color:#6366f1');
        this.setupUI();
        await this.loadAI();
    },

    setupUI() {
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
        window.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            const rect = document.getElementById('before-after').getBoundingClientRect();
            let percent = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
            document.getElementById('before-img').style.width = percent + '%';
            document.getElementById('after-img').style.left = percent + '%';
            divider.style.left = percent + '%';
        });
    },

    async loadAI() {
        const statusEl = document.getElementById('status');
        try {
            // Try latest stable version
            const url = 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm';
            console.log('Loading AI from:', url);
            
            const module = await import(url);
            this.removeBackgroundFn = module.removeBackground;
            this.isReady = true;
            
            statusEl.textContent = '✅ AI Engine Ready';
            statusEl.style.color = '#22c55e';
            console.log('%c[RemoveBG] AI Loaded Successfully', 'color:#22c55e');
            
        } catch (err) {
            console.error("AI Load Failed:", err);
            statusEl.textContent = '⚠️ AI Failed - Using Fallback';
            statusEl.style.color = '#f59e0b';
            this.showToast("AI engine failed to load. Using basic mode.", "error");
        }
    },

    handleFiles(fileList) {
        Array.from(fileList).slice(0, this.MAX_FILES - this.filesData.length).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            
            const reader = new FileReader();
            reader.onload = e => {
                const img = new Image();
                img.onload = () => {
                    this.filesData.push({
                        id: Date.now(),
                        name: file.name,
                        originalUrl: e.target.result,
                        processedUrl: null,
                        blob: null
                    });
                    this.renderFiles();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    },

    renderFiles() {
        const container = document.getElementById('files-list');
        container.innerHTML = '';
        
        this.filesData.forEach((file, i) => {
            const card = document.createElement('div');
            card.className = 'file-card';
            card.innerHTML = `
                <div class="preview-container">
                    <img src="${file.originalUrl}" class="preview">
                    <div class="processing-overlay" id="overlay-${file.id}">
                        <div>AI Processing...</div>
                        <div style="width:80%;height:6px;background:#334155;margin-top:12px;border-radius:999px;overflow:hidden;">
                            <div style="height:100%;width:0%;background:linear-gradient(90deg,#6366f1,#a5b4fc);transition:width 0.4s;" id="prog-${file.id}"></div>
                        </div>
                    </div>
                </div>
                <div style="padding:16px;">
                    <div style="font-size:13px;margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${file.name}</div>
                    <button onclick="RemoveBG.processSingle(${i})" class="btn-primary" style="width:100%;margin-bottom:6px;">Remove Background</button>
                    \( {file.processedUrl ? `<button onclick="RemoveBG.showResult( \){i})" class="btn-secondary" style="width:100%">View Result</button>` : ''}
                </div>
            `;
            container.appendChild(card);
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

            if (this.isReady && this.removeBackgroundFn) {
                const img = new Image();
                img.src = file.originalUrl;
                await new Promise(r => img.onload = r);

                resultBlob = await this.removeBackgroundFn(img, {
                    model: 'isnet',
                    output: { format: 'image/png' }
                });
            } else {
                // Fallback
                resultBlob = await this.fallbackProcess(file.originalUrl);
            }

            file.processedUrl = URL.createObjectURL(resultBlob);
            file.blob = resultBlob;

            this.renderFiles();
            this.showToast(`${file.name} processed successfully!`);
        } catch (err) {
            console.error(err);
            this.showToast("Processing failed. Try again.", "error");
        } finally {
            overlay.style.display = 'none';
        }
    },

    async fallbackProcess(dataUrl) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.getContext('2d').drawImage(img, 0, 0);
                canvas.toBlob(resolve, 'image/png');
            };
            img.src = dataUrl;
        });
    },

    async processAll() {
        for (let i = 0; i < this.filesData.length; i++) {
            if (!this.filesData[i].processedUrl) await this.processSingle(i);
        }
        document.getElementById('download-all-btn').style.display = 'inline-block';
    },

    showResult(i) {
        const file = this.filesData[i];
        document.getElementById('current-file-name').textContent = file.name;
        document.getElementById('original-preview').src = file.originalUrl;
        document.getElementById('processed-preview').src = file.processedUrl;
        document.getElementById('result-panel').style.display = 'block';
    },

    closeResult() {
        document.getElementById('result-panel').style.display = 'none';
    },

    downloadCurrent() {
        const file = this.filesData.find(f => f.processedUrl);
        if (!file) return;
        const a = document.createElement('a');
        a.href = file.processedUrl;
        a.download = file.name.replace(/\.\w+$/, '') + '-nobg.png';
        a.click();
    },

    async downloadAll() {
        const zip = new JSZip();
        this.filesData.forEach(f => {
            if (f.blob) zip.file(f.name.replace(/\.\w+$/, '') + '-nobg.png', f.blob);
        });
        const content = await zip.generateAsync({type: "blob"});
        saveAs(content, `removed-bg-${Date.now()}.zip`);
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
        setTimeout(() => toast.style.display = 'none', 2800);
    }
};

window.onload = () => RemoveBG.init();
window.RemoveBG = RemoveBG;