/* ==========================================================================
   PIXELPRESS REMOVE BG ENGINE
   PRODUCTION READY
   FULLY SCOPED
   MEMORY SAFE
   VERCEL SAFE
   ========================================================================== */

(() => {
  "use strict";

  /* ==========================================================================
     SAFE DOM HELPERS
     ========================================================================== */

  const $ = (id) => document.getElementById(id);

  const dom = {
    tool: $("ppRbgTool"),

    overlay: $("ppRbgOverlay"),
    overlayTitle: $("ppRbgOverlayTitle"),
    overlaySub: $("ppRbgOverlaySub"),
    overlayFile: $("ppRbgOverlayFile"),
    overlayProgress: $("ppRbgModelProgress"),
    fallbackBtn: $("ppRbgFallbackBtn"),

    dropZone: $("ppRbgDropZone"),
    fileInput: $("ppRbgFileInput"),

    batchWrap: $("ppRbgBatchWrap"),
    batchProgress: $("ppRbgBatchProgress"),
    batchText: $("ppRbgBatchText"),

    resultsSection: $("ppRbgResultsSection"),
    resultsGrid: $("ppRbgResults"),

    bgType: $("ppRbgBgType"),

    solidWrap: $("ppRbgSolidWrap"),
    solidColor: $("ppRbgSolidColor"),

    gradientWrap: $("ppRbgGradientWrap"),
    gradientStart: $("ppRbgGradientStart"),
    gradientEnd: $("ppRbgGradientEnd"),

    customWrap: $("ppRbgCustomWrap"),
    customBgInput: $("ppRbgCustomBg"),

    blurWrap: $("ppRbgBlurWrap"),
    blurAmount: $("ppRbgBlurAmount"),
    blurValue: $("ppRbgBlurValue"),

    feather: $("ppRbgFeather"),
    featherValue: $("ppRbgFeatherValue"),

    outputFormat: $("ppRbgOutputFormat"),

    applyBtn: $("ppRbgApplyBtn"),
    zipBtn: $("ppRbgZipBtn")
  };

  /* ==========================================================================
     RUNTIME CONFIG
     ========================================================================== */

  const CONFIG = {
    MAX_FILES: 10,
    MAX_IMAGE_DIMENSION: 1400,
    EXPORT_QUALITY: 0.95,
    MAX_CANVAS_PIXELS: 4096 * 4096
  };

  /* ==========================================================================
     ENGINE STATE
     ========================================================================== */

  const state = {
    segmenter: null,
    modelReady: false,
    manualMode: false,
    customBackgroundImage: null,
    processing: false,
    results: []
  };

  /* ==========================================================================
     TRANSFORMERS CONFIG
     ========================================================================== */

  const transformers = window.transformers;

  if (transformers && transformers.env) {
    transformers.env.allowLocalModels = false;
    transformers.env.useBrowserCache = true;
    transformers.env.backends.onnx.wasm.numThreads = 1;
  }

  /* ==========================================================================
     UTILITIES
     ========================================================================== */

  function showOverlay() {
    dom.overlay.style.display = "flex";
  }

  function hideOverlay() {
    dom.overlay.style.display = "none";
  }

  function updateOverlay(title, sub, file, progress) {
    dom.overlayTitle.textContent = title || "";
    dom.overlaySub.textContent = sub || "";
    dom.overlayFile.textContent = file || "";

    if (typeof progress === "number") {
      dom.overlayProgress.value = Math.max(
        0,
        Math.min(100, progress)
      );
    }
  }

  function safeFileName(name) {
    return name.replace(/\.[^/.]+$/, "").replace(/[^\w-]/g, "_");
  }

  function revokeObjectURL(url) {
    if (url && typeof url === "string") {
      URL.revokeObjectURL(url);
    }
  }

  function cleanupCanvas(canvas) {
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    canvas.width = 1;
    canvas.height = 1;
  }

  function delay(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  /* ==========================================================================
     MEMORY CLEANUP
     ========================================================================== */

  function purgeResults() {
    state.results.forEach((item) => {
      revokeObjectURL(item.originalURL);
      revokeObjectURL(item.processedURL);
    });

    state.results.length = 0;

    dom.resultsGrid.innerHTML = "";
  }

  /* ==========================================================================
     FILE HELPERS
     ========================================================================== */

  async function fileToImage(file) {
    return new Promise((resolve, reject) => {
      const objectURL = URL.createObjectURL(file);

      const image = new Image();

      image.onload = () => {
        revokeObjectURL(objectURL);
        resolve(image);
      };

      image.onerror = () => {
        revokeObjectURL(objectURL);
        reject(new Error("Failed to load image."));
      };

      image.src = objectURL;
    });
  }

  async function blobToImage(blob) {
    return new Promise((resolve, reject) => {
      const objectURL = URL.createObjectURL(blob);

      const image = new Image();

      image.onload = () => {
        revokeObjectURL(objectURL);
        resolve(image);
      };

      image.onerror = () => {
        revokeObjectURL(objectURL);
        reject(new Error("Failed to decode image blob."));
      };

      image.src = objectURL;
    });
  }

  async function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas export failed."));
            return;
          }

          resolve(blob);
        },
        type,
        quality
      );
    });
  }

  /* ==========================================================================
     IMAGE OPTIMIZER
     PREVENTS TAB CRASHES
     ========================================================================== */

  async function optimizeImage(file) {
    const image = await fileToImage(file);

    const originalWidth = image.width;
    const originalHeight = image.height;

    let targetWidth = originalWidth;
    let targetHeight = originalHeight;

    const maxDimension = CONFIG.MAX_IMAGE_DIMENSION;

    if (
      originalWidth > maxDimension ||
      originalHeight > maxDimension
    ) {
      const ratio = Math.min(
        maxDimension / originalWidth,
        maxDimension / originalHeight
      );

      targetWidth = Math.round(originalWidth * ratio);
      targetHeight = Math.round(originalHeight * ratio);
    }

    const canvas = document.createElement("canvas");

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d", {
      alpha: true,
      willReadFrequently: false
    });

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      image,
      0,
      0,
      targetWidth,
      targetHeight
    );

    const blob = await canvasToBlob(
      canvas,
      "image/png",
      0.95
    );

    cleanupCanvas(canvas);

    return blob;
  }

  /* ==========================================================================
     AI ENGINE INIT
     ========================================================================== */

  async function initializeAI() {
    showOverlay();

    updateOverlay(
      "Initializing AI Engine",
      "Preparing browser-safe segmentation runtime...",
      "Loading dependencies...",
      5
    );

    if (!transformers || !transformers.pipeline) {
      throw new Error("Transformers runtime not available.");
    }

    try {
      const { pipeline } = transformers;

      state.segmenter = await pipeline(
        "image-segmentation",
        "Xenova/modnet-onnx",
        {
          device: "wasm",

          progress_callback: (progress) => {
            if (!progress) return;

            if (progress.status === "progress") {
              updateOverlay(
                "Downloading AI Model",
                "Fetching neural weights...",
                progress.file || "Preparing...",
                Math.round(progress.progress || 0)
              );
            }

            if (progress.status === "done") {
              updateOverlay(
                "Finalizing",
                "Optimizing runtime...",
                "Almost ready...",
                100
              );
            }
          }
        }
      );

      state.modelReady = true;

      updateOverlay(
        "AI Engine Ready",
        "Background remover initialized successfully.",
        "Ready to process images.",
        100
      );

      await delay(700);

      hideOverlay();
    } catch (error) {
      console.error("AI initialization failed:", error);

      state.manualMode = true;

      updateOverlay(
        "AI Engine Failed",
        "Falling back to manual compatibility mode.",
        error.message || "Unknown error.",
        100
      );

      dom.fallbackBtn.classList.remove("pp-rbg-hidden");
    }
  }

  /* ==========================================================================
     FALLBACK MODE
     ========================================================================== */

  function activateManualMode() {
    state.manualMode = true;
    hideOverlay();

    window.alert(
      "AI model could not load. Manual fallback mode enabled."
    );
  }

  /* ==========================================================================
     LEGACY CHROMA KEY
     ========================================================================== */

  async function chromaKeyFallback(imageBlob) {
    const image = await blobToImage(imageBlob);

    const hex = window.prompt(
      "Enter background color hex to remove:",
      "#ffffff"
    );

    if (!hex) {
      throw new Error("Operation cancelled.");
    }

    const canvas = document.createElement("canvas");

    canvas.width = image.width;
    canvas.height = image.height;

    const ctx = canvas.getContext("2d", {
      willReadFrequently: true
    });

    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

    const data = imageData.data;

    const clean = hex.replace("#", "");

    const targetR = parseInt(clean.substring(0, 2), 16);
    const targetG = parseInt(clean.substring(2, 4), 16);
    const targetB = parseInt(clean.substring(4, 6), 16);

    const tolerance = 45;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (
        Math.abs(r - targetR) < tolerance &&
        Math.abs(g - targetG) < tolerance &&
        Math.abs(b - targetB) < tolerance
      ) {
        data[i + 3] = 0;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const blob = await canvasToBlob(
      canvas,
      "image/png",
      1
    );

    cleanupCanvas(canvas);

    return blob;
  }

  /* ==========================================================================
     AI REMOVE BG
     ========================================================================== */

  async function removeBackground(imageBlob) {
    if (state.manualMode || !state.segmenter) {
      return chromaKeyFallback(imageBlob);
    }

    const image = await blobToImage(imageBlob);

    const result = await state.segmenter(image);

    let mask = null;

    if (Array.isArray(result) && result.length > 0) {
      mask = result[0].mask || result[0];
    } else {
      mask = result.mask || result;
    }

    if (!mask) {
      throw new Error("Invalid AI segmentation output.");
    }

    const outputCanvas = document.createElement("canvas");

    outputCanvas.width = image.width;
    outputCanvas.height = image.height;

    const outputCtx = outputCanvas.getContext("2d");

    outputCtx.drawImage(image, 0, 0);

    const maskCanvas = document.createElement("canvas");

    maskCanvas.width = image.width;
    maskCanvas.height = image.height;

    const maskCtx = maskCanvas.getContext("2d");

    if (typeof mask.toCanvas === "function") {
      const generatedMask = mask.toCanvas();

      maskCtx.drawImage(
        generatedMask,
        0,
        0,
        image.width,
        image.height
      );
    } else if (mask.data) {
      const width = mask.width;
      const height = mask.height;

      const tempCanvas = document.createElement("canvas");

      tempCanvas.width = width;
      tempCanvas.height = height;

      const tempCtx = tempCanvas.getContext("2d");

      const imgData = tempCtx.createImageData(width, height);

      for (let i = 0; i < mask.data.length; i++) {
        const value = Math.round(mask.data[i] * 255);

        const index = i * 4;

        imgData.data[index] = value;
        imgData.data[index + 1] = value;
        imgData.data[index + 2] = value;
        imgData.data[index + 3] = 255;
      }

      tempCtx.putImageData(imgData, 0, 0);

      maskCtx.drawImage(
        tempCanvas,
        0,
        0,
        image.width,
        image.height
      );

      cleanupCanvas(tempCanvas);
    } else {
      throw new Error("Unsupported mask output.");
    }

    outputCtx.globalCompositeOperation =
      "destination-in";

    outputCtx.drawImage(maskCanvas, 0, 0);

    outputCtx.globalCompositeOperation = "source-over";

    const blob = await canvasToBlob(
      outputCanvas,
      "image/png",
      1
    );

    cleanupCanvas(maskCanvas);
    cleanupCanvas(outputCanvas);

    return blob;
  }

  /* ==========================================================================
     PROCESS FILES
     ========================================================================== */

  async function processFiles(files) {
    if (state.processing) return;

    state.processing = true;

    purgeResults();

    dom.batchWrap.style.display = "block";

    dom.resultsSection.classList.add("pp-rbg-hidden");

    const validFiles = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, CONFIG.MAX_FILES);

    if (validFiles.length === 0) {
      window.alert("Please select valid images.");
      state.processing = false;
      return;
    }

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];

      const progress = Math.round(
        (i / validFiles.length) * 100
      );

      dom.batchProgress.value = progress;

      dom.batchText.textContent =
        `Processing ${i + 1} of ${validFiles.length}: ${file.name}`;

      try {
        const optimizedBlob = await optimizeImage(file);

        await delay(30);

        const processedBlob =
          await removeBackground(optimizedBlob);

        const result = {
          file,
          originalBlob: optimizedBlob,
          cutoutBlob: processedBlob,
          currentBlob: processedBlob,
          originalURL: "",
          processedURL: ""
        };

        state.results.push(result);
      } catch (error) {
        console.error("Processing failed:", error);

        state.results.push({
          file,
          error: true,
          errorMessage:
            error.message || "Unknown processing error."
        });
      }

      await delay(50);
    }

    dom.batchProgress.value = 100;

    dom.batchText.textContent =
      "Processing completed.";

    renderResults();

    dom.resultsSection.classList.remove("pp-rbg-hidden");

    state.processing = false;
  }

  /* ==========================================================================
     RENDER RESULTS
     ========================================================================== */

  function renderResults() {
    dom.resultsGrid.innerHTML = "";

    state.results.forEach((item, index) => {
      if (item.error) {
        const errorCard = document.createElement("div");

        errorCard.className = "pp-rbg-item";

        errorCard.innerHTML = `
          <div class="pp-rbg-error">
            ⚠️ ${item.errorMessage}
          </div>
        `;

        dom.resultsGrid.appendChild(errorCard);

        return;
      }

      revokeObjectURL(item.originalURL);
      revokeObjectURL(item.processedURL);

      item.originalURL = URL.createObjectURL(
        item.originalBlob
      );

      item.processedURL = URL.createObjectURL(
        item.currentBlob
      );

      const card = document.createElement("div");

      card.className = "pp-rbg-item";

      card.innerHTML = `
        <div class="pp-rbg-name">
          ${item.file.name}
        </div>

        <div class="pp-rbg-compare">
          <img
            class="pp-rbg-before"
            src="${item.originalURL}"
            alt="Original"
            loading="lazy"
          />

          <img
            class="pp-rbg-after"
            src="${item.processedURL}"
            alt="Processed"
            loading="lazy"
          />

          <div class="pp-rbg-divider"></div>

          <div class="pp-rbg-handle">
            ⇆
          </div>
        </div>

        <div class="pp-rbg-item-footer">
          <button
            class="pp-rbg-btn pp-rbg-btn-outline pp-rbg-save"
            data-index="${index}"
          >
            Save
          </button>
        </div>
      `;

      dom.resultsGrid.appendChild(card);

      initializeSlider(card);
    });

    updateZipButton();
  }

  /* ==========================================================================
     SLIDER
     ========================================================================== */

  function initializeSlider(card) {
    const compare = card.querySelector(".pp-rbg-compare");

    const after = card.querySelector(".pp-rbg-after");

    const divider = card.querySelector(".pp-rbg-divider");

    let dragging = false;

    function update(clientX) {
      const rect = compare.getBoundingClientRect();

      let ratio = (clientX - rect.left) / rect.width;

      ratio = Math.max(0, Math.min(1, ratio));

      const percent = ratio * 100;

      after.style.clipPath =
        `inset(0 ${100 - percent}% 0 0)`;

      divider.style.left = `${percent}%`;
    }

    compare.addEventListener("pointerdown", (event) => {
      dragging = true;

      update(event.clientX);

      compare.setPointerCapture(event.pointerId);
    });

    compare.addEventListener("pointermove", (event) => {
      if (!dragging) return;

      update(event.clientX);
    });

    compare.addEventListener("pointerup", () => {
      dragging = false;
    });

    compare.addEventListener("pointercancel", () => {
      dragging = false;
    });
  }

  /* ==========================================================================
     BACKGROUND OPTIONS
     ========================================================================== */

  function updateBackgroundControls() {
    const mode = dom.bgType.value;

    dom.solidWrap.classList.toggle(
      "pp-rbg-hidden",
      mode !== "solid"
    );

    dom.gradientWrap.classList.toggle(
      "pp-rbg-hidden",
      mode !== "gradient"
    );

    dom.customWrap.classList.toggle(
      "pp-rbg-hidden",
      mode !== "custom"
    );

    dom.blurWrap.classList.toggle(
      "pp-rbg-hidden",
      mode !== "blur"
    );

    if (mode === "transparent") {
      dom.outputFormat.value = "image/png";
    }
  }

  /* ==========================================================================
     CUSTOM BG
     ========================================================================== */

  async function loadCustomBackground(file) {
    if (!file) return;

    state.customBackgroundImage =
      await fileToImage(file);
  }

  /* ==========================================================================
     APPLY BACKGROUND
     ========================================================================== */

  async function applyBackgrounds() {
    if (state.processing) return;

    state.processing = true;

    dom.applyBtn.disabled = true;

    dom.applyBtn.textContent = "Applying...";

    const bgType = dom.bgType.value;

    const feather = parseFloat(dom.feather.value);

    const exportFormat = dom.outputFormat.value;

    try {
      for (const item of state.results) {
        if (item.error) continue;

        const cutoutImage = await blobToImage(
          item.cutoutBlob
        );

        const originalImage = await blobToImage(
          item.originalBlob
        );

        const canvas = document.createElement("canvas");

        canvas.width = cutoutImage.width;
        canvas.height = cutoutImage.height;

        const ctx = canvas.getContext("2d");

        /* ==============================================================
           BACKGROUND
           ============================================================== */

        if (bgType === "solid") {
          ctx.fillStyle = dom.solidColor.value;

          ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
          );
        }

        if (bgType === "gradient") {
          const gradient =
            ctx.createLinearGradient(
              0,
              0,
              canvas.width,
              canvas.height
            );

          gradient.addColorStop(
            0,
            dom.gradientStart.value
          );

          gradient.addColorStop(
            1,
            dom.gradientEnd.value
          );

          ctx.fillStyle = gradient;

          ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
          );
        }

        if (bgType === "blur") {
          ctx.filter =
            `blur(${dom.blurAmount.value}px)`;

          ctx.drawImage(
            originalImage,
            0,
            0,
            canvas.width,
            canvas.height
          );

          ctx.filter = "none";
        }

        if (
          bgType === "custom" &&
          state.customBackgroundImage
        ) {
          ctx.drawImage(
            state.customBackgroundImage,
            0,
            0,
            canvas.width,
            canvas.height
          );
        }

        /* ==============================================================
           FEATHER
           ============================================================== */

        if (feather > 0) {
          const featherCanvas =
            document.createElement("canvas");

          featherCanvas.width = canvas.width;
          featherCanvas.height = canvas.height;

          const featherCtx =
            featherCanvas.getContext("2d");

          featherCtx.filter = `blur(${feather}px)`;

          featherCtx.drawImage(cutoutImage, 0, 0);

          featherCtx.filter = "none";

          ctx.drawImage(featherCanvas, 0, 0);

          cleanupCanvas(featherCanvas);
        }

        /* ==============================================================
           FOREGROUND
           ============================================================== */

        ctx.drawImage(cutoutImage, 0, 0);

        item.currentBlob = await canvasToBlob(
          canvas,
          exportFormat,
          CONFIG.EXPORT_QUALITY
        );

        cleanupCanvas(canvas);

        await delay(20);
      }

      renderResults();
    } catch (error) {
      console.error(error);

      window.alert(
        "Failed to apply background changes."
      );
    }

    dom.applyBtn.disabled = false;

    dom.applyBtn.textContent = "Apply Background";

    state.processing = false;
  }

  /* ==========================================================================
     DOWNLOAD SINGLE
     ========================================================================== */

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = filename;

    document.body.appendChild(a);

    a.click();

    a.remove();

    window.setTimeout(() => {
      revokeObjectURL(url);
    }, 500);
  }

  function getExportExtension() {
    const format = dom.outputFormat.value;

    if (format === "image/jpeg") {
      return "jpg";
    }

    if (format === "image/webp") {
      return "webp";
    }

    return "png";
  }

  function saveSingle(index) {
    const item = state.results[index];

    if (!item || item.error) return;

    const ext = getExportExtension();

    const filename =
      `pixelpress-${safeFileName(item.file.name)}.${ext}`;

    downloadBlob(item.currentBlob, filename);
  }

  /* ==========================================================================
     ZIP DOWNLOAD
     ========================================================================== */

  async function downloadZip() {
    if (!window.JSZip) {
      window.alert("JSZip failed to load.");
      return;
    }

    const zip = new window.JSZip();

    const ext = getExportExtension();

    for (const item of state.results) {
      if (item.error) continue;

      const filename =
        `pixelpress-${safeFileName(item.file.name)}.${ext}`;

      zip.file(filename, item.currentBlob);
    }

    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: {
        level: 6
      }
    });

    downloadBlob(
      zipBlob,
      "pixelpress-background-remover.zip"
    );
  }

  /* ==========================================================================
     ZIP BUTTON
     ========================================================================== */

  function updateZipButton() {
    const hasResults = state.results.some(
      (item) => !item.error
    );

    dom.zipBtn.disabled = !hasResults;
  }

  /* ==========================================================================
     EVENTS
     ========================================================================== */

  function bindEvents() {
    dom.dropZone.addEventListener("click", () => {
      dom.fileInput.click();
    });

    dom.dropZone.addEventListener("keydown", (event) => {
      if (
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();

        dom.fileInput.click();
      }
    });

    dom.dropZone.addEventListener("dragover", (event) => {
      event.preventDefault();

      dom.dropZone.classList.add("pp-rbg-dragover");
    });

    dom.dropZone.addEventListener("dragleave", () => {
      dom.dropZone.classList.remove("pp-rbg-dragover");
    });

    dom.dropZone.addEventListener("drop", (event) => {
      event.preventDefault();

      dom.dropZone.classList.remove("pp-rbg-dragover");

      processFiles(event.dataTransfer.files);
    });

    dom.fileInput.addEventListener("change", (event) => {
      processFiles(event.target.files);

      event.target.value = "";
    });

    dom.bgType.addEventListener(
      "change",
      updateBackgroundControls
    );

    dom.blurAmount.addEventListener("input", () => {
      dom.blurValue.textContent =
        `${dom.blurAmount.value}px`;
    });

    dom.feather.addEventListener("input", () => {
      dom.featherValue.textContent =
        `${dom.feather.value}px`;
    });

    dom.customBgInput.addEventListener(
      "change",
      async (event) => {
        const file = event.target.files[0];

        if (!file) return;

        try {
          await loadCustomBackground(file);
        } catch (error) {
          console.error(error);

          window.alert(
            "Failed to load custom background."
          );
        }
      }
    );

    dom.applyBtn.addEventListener(
      "click",
      applyBackgrounds
    );

    dom.zipBtn.addEventListener(
      "click",
      downloadZip
    );

    dom.resultsGrid.addEventListener(
      "click",
      (event) => {
        const button =
          event.target.closest(".pp-rbg-save");

        if (!button) return;

        const index = Number(
          button.dataset.index
        );

        saveSingle(index);
      }
    );

    dom.fallbackBtn.addEventListener(
      "click",
      activateManualMode
    );
  }

  /* ==========================================================================
     STARTUP
     ========================================================================== */

  async function boot() {
    try {
      bindEvents();

      updateBackgroundControls();

      await initializeAI();
    } catch (error) {
      console.error("Boot failed:", error);

      hideOverlay();

      window.alert(
        "Background remover failed to initialize."
      );
    }
  }

  /* ==========================================================================
     INIT
     ========================================================================== */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();
