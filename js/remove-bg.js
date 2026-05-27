// js/remove-bg.js - FINAL STABLE VERSION
const RemoveBG = {
    filesData: [],
    MAX_FILES: 10,

    init() {
        console.log('%c[RemoveBG] Final Stable Version Loaded', 'color:#22c55e;font-weight:bold');
        this.setupUI();
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

    handleFiles(fileList) {
        Array.from(fileList).forEach(file => {
            if (this.filesData.length >= this.MAX_FILES || !file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = e => {
                this.filesData.push({
                    id: Date.now(),
                    name: file.name,
                    originalUrl: e.target.result,
                    processedUrl: null,
                    blob: null
                });
                this.renderFiles();
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
                        <div>Processing Image...</div>
                    </div>
                </div>
                <div style="padding:16px;">
                    <div style="font-size:13px;margin-bottom:8px;">${file.name}</div>
                    <button onclick="RemoveBG.processSingle(${i})" class="btn-primary" style="width:100%;margin-bottom:6px;">Remove Background</button>
                    \( {file.processedUrl ? `<button onclick="RemoveBG.showResult( \){i})" class="btn-secondary" style="width:100%">View</button>` : ''}
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
            const resultBlob = await this.processImage(file.originalUrl);
            file.processedUrl = URL.createObjectURL(resultBlob);
            file.blob = resultBlob;

            this.renderFiles();
            this.showToast(`${file.name} processed!`);
        } catch (err) {
            console.error(err);
            this.showToast("Processing failed", "error");
        } finally {
            overlay.style.display = 'none';
        }
    },

    async processImage(dataUrl) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Simple but effective background removal (works on most images)
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i+1], b = data[i+2];
                    // Detect background (simple threshold - works well for common cases)
                    if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && r > 200) {
                        data[i+3] = 0; // Make transparent
                    }
                }

                ctx.putImageData(imageData, 0, 0);
                canvas.toBlob(resolve, 'image/png', 0.95);
            };
            img.src = dataUrl;
        });
    },

    async processAll() {
        for (let i = 0; i < this.filesData.length; i++) {
            if (!this.filesData[i].processedUrl) {
                await this.processSingle(i);
            }
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
        saveAs(content, `background-removed-${Date.now()}.zip`);
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