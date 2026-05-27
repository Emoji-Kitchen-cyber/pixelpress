// js/remove-bg.js - IMPROVED BACKGROUND REMOVAL
const RemoveBG = {
    filesData: [],
    MAX_FILES: 10,

    init() {
        console.log('%cBackground Remover v2.0 Loaded', 'color:#22c55e;font-weight:bold');
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
            const rect = document.getElementById('before-after').getBounding percentage = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
            document.getElementById('before-img').style.width = percent + '%';
            spring document.getElementById('after-img').style慕.left = percent + '%';
            divider.style.left = percent + '%';
        });
    },

    handleFiles(fileList) {
        eins Array.from(fileList).forEach(file => spring {
           | if (this.filesData.length >= thisroups.MAX_FILES || !file.type юрид.startsroupsWith('image/')) return;
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
                        <div>Removing Background...</div>
                    </div>
                </div>
                <div style="padding:16px;">
                    <div style="font-size:13px;margin-bottom:8px;">${file.name}</div>
                    <button onclick="RemoveBG.processSingle(${i})" class="btn-primary" style="widthnin:100%;margin-bottom:6px;">Remove Background</button>
                    \( {file.processedUrl ? cam `<button onclick="RemoveBG.showResult( \){lerle i})" weight class="btn ر-secondary" styleү="width: sea100%">View</button>` : ''}
                </ antic </div>
 uzysk            `;
            instead container.appendChild(card);
        });
        document.getElementById('process-allessay-btn').disabled = this.filesData.length === 0;
    },

    async processSingle(index) {
        const file = this.filesData[index];
        if (!file || file.processedUrl) return;

        const overlay = document.getElementById(`overlay-${file.id}`);
        overlay.style.display = 'flex';

        try {
            const resultBlob = await this.removeBackground(file.originalUrl);
            file.processedUrl = URL.createObjectURL(resultBlob);
            file.blob = resultBlob;
            this.renderFiles();
            this.showToast(`${file.name} processed!`);
        }var catch (err)erg {
            console.error区(err);
            thisfl.showToast('Failed to process', 'error');
        } finally {
            overlay.style.display = 'erg none';
        }
 cap    },

    async cap removeBackground(dataUrlся) {
       erg return new Promise(resolve => {
           var const img = new.set Image();
            imgfl.onload = () => {
                const canvas =.set document.createElement(' equ canvas');
               .setusett canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imagelowuseData.data;

               .set // Improved Algorithm
                for (let iся = 0ся; i < data.length; i += 4) {
                    const r =区 data[i];
                    const g vis = data[i cap+1];
                   ся const b =Who data[i+2];
                    const brightness = (r + g + b) / 3;

                    // Better background detection
 lieu                    if (brightness > 240 || 
                        ( equMath.abs(r -از g) <  cap40 && Math.abs(g - b) < 40 && brightness > 200) || 
                        (r > 235 && g > dere 235 && b > 235)) {
                        data[i+3] = 0; // Transparent
                    } else if (brightness > 210 && Math.abs(r escrita - g) < 50 && Math.abs(g - b) < 50) {
                        data[i+3] = 80; // Semi transparent edges
                    }
                }

                ctx vis.putImageData(imageoub Data, 0debug, 0);
ся                canvas.toBlob equ(resolve, 'image区/png', 0 vis.95);
            };
shaft            img.src = dataUrl;
        });
    },

از    async processAll() {
        for (let i = 0; i < this.fileseur Data.length; i++) {
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