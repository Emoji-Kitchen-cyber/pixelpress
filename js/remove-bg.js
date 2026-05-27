import {
  removeBackground
} from "https://cdn.jsdelivr.net/npm/@imgly/background-removal/+esm";

(() => {
  "use strict";

  /* =========================================================
     DOM
     ========================================================= */

  const $ = (id) => document.getElementById(id);

  const dom = {
    loader: $("ppRbgLoader"),
    loaderText: $("ppRbgLoaderText"),
    loaderProgress: $("ppRbgModelProgress"),

    dropzone: $("ppRbgDropzone"),
    input: $("ppRbgInput"),

    progressWrap: $("ppRbgProgressWrap"),
    progress: $("ppRbgProgress"),
    progressText: $("ppRbgProgressText"),

    resultsSection: $("ppRbgResultsSection"),
    results: $("ppRbgResults"),

    bgType: $("ppRbgBgType"),

    solidWrap: $("ppRbgSolidWrap"),
    solidColor: $("ppRbgSolidColor"),

    gradientWrap: $("ppRbgGradientWrap"),
    grad1: $("ppRbgGrad1"),
    grad2: $("ppRbgGrad2"),

    blurWrap: $("ppRbgBlurWrap"),
    blur: $("ppRbgBlur"),
    blurValue: $("ppRbgBlurValue"),

    customWrap: $("ppRbgCustomWrap"),
    customBg: $("ppRbgCustomBg"),

    feather: $("ppRbgFeather"),
    featherValue: $("ppRbgFeatherValue"),

    format: $("ppRbgFormat"),

    apply: $("ppRbgApply"),
    zip: $("ppRbgZip")
  };

  /* =========================================================
     STATE
     ========================================================= */

  const state = {
    results: [],
    customImage: null,
    processing: false
  };

  /* =========================================================
     HELPERS
     ========================================================= */

  function delay(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  function revoke(url) {
    if (url) URL.revokeObjectURL(url);
  }

  function cleanupCanvas(canvas) {
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.clearRect(0,0,canvas.width,canvas.height);
    }

    canvas.width = 1;
    canvas.height = 1;
  }

  function getExtension(type) {
    if (type === "image/jpeg") return "jpg";
    if (type === "image/webp") return "webp";
    return "png";
  }

  function safeName(name) {
    return name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^\w-]/g, "_");
  }

  /* =========================================================
     IMAGE HELPERS
     ========================================================= */

  async function fileToImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);

      const img = new Image();

      img.onload = () => {
        revoke(url);
        resolve(img);
      };

      img.onerror = () => {
        revoke(url);
        reject(new Error("Image load failed"));
      };

      img.src = url;
    });
  }

  async function blobToImage(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);

      const img = new Image();

      img.onload = () => {
        revoke(url);
        resolve(img);
      };

      img.onerror = () => {
        revoke(url);
        reject(new Error("Blob image failed"));
      };

      img.src = url;
    });
  }

  async function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas export failed"));
          return;
        }

        resolve(blob);
      }, type, quality);
    });
  }

  /* =========================================================
     IMAGE OPTIMIZER
     ========================================================= */

  async function optimizeImage(file) {
    const img = await fileToImage(file);

    const MAX = 1024;

    let width = img.width;
    let height = img.height;

    if (width > MAX || height > MAX) {
      const ratio = Math.min(MAX / width, MAX / height);

      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(img,0,0,width,height);

    const blob = await canvasToBlob(
      canvas,
      "image/png",
      0.95
    );

    cleanupCanvas(canvas);

    return blob;
  }

  /* =========================================================
     REMOVE BG
     ========================================================= */

  async function processImage(blob) {
    const arrayBuffer = await blob.arrayBuffer();

    const resultBlob = await removeBackground(
      arrayBuffer,
      {
        progress: (key, current, total) => {
          const value = total
            ? Math.round((current / total) * 100)
            : 0;

          dom.loaderProgress.value = value;

          dom.loaderText.textContent =
            `${key} ${value}%`;
        }
      }
    );

    return resultBlob;
  }

  /* =========================================================
     PROCESS FILES
     ========================================================= */

  async function handleFiles(files) {
    if (state.processing) return;

    state.processing = true;

    dom.results.innerHTML = "";

    state.results = [];

    const valid = Array.from(files)
      .filter(file => file.type.startsWith("image/"))
      .slice(0,10);

    if (!valid.length) {
      state.processing = false;
      return;
    }

    dom.progressWrap.style.display = "block";

    for (let i=0; i<valid.length; i++) {

      const file = valid[i];

      dom.progress.value =
        Math.round((i / valid.length) * 100);

      dom.progressText.textContent =
        `Processing ${i+1} / ${valid.length}`;

      try {
        dom.loader.style.display = "flex";

        const optimized =
          await optimizeImage(file);

        const removed =
          await processImage(optimized);

        dom.loader.style.display = "none";

        state.results.push({
          file,
          originalBlob: optimized,
          cutoutBlob: removed,
          currentBlob: removed
        });

      } catch (err) {
        console.error(err);

        state.results.push({
          file,
          error: true,
          message: err.message
        });

        dom.loader.style.display = "none";
      }

      await delay(50);
    }

    dom.progress.value = 100;

    dom.progressText.textContent =
      "Processing completed";

    renderResults();

    dom.resultsSection.classList.remove(
      "pp-rbg-hidden"
    );

    state.processing = false;
  }

  /* =========================================================
     RENDER
     ========================================================= */

  function renderResults() {

    dom.results.innerHTML = "";

    state.results.forEach((item,index) => {

      if (item.error) {
        return;
      }

      const originalURL =
        URL.createObjectURL(item.originalBlob);

      const processedURL =
        URL.createObjectURL(item.currentBlob);

      const card = document.createElement("div");

      card.className = "pp-rbg-result-card";

      card.innerHTML = `
        <div class="pp-rbg-file-name">
          ${item.file.name}
        </div>

        <div class="pp-rbg-compare">

          <img
            class="pp-rbg-before"
            src="${originalURL}"
          />

          <img
            class="pp-rbg-after"
            src="${processedURL}"
          />

          <div class="pp-rbg-divider"></div>

          <div class="pp-rbg-handle">
            ⇆
          </div>

        </div>

        <div class="pp-rbg-result-actions">

          <button
            class="pp-rbg-btn pp-rbg-btn-outline pp-save-btn"
            data-index="${index}"
          >
            Save
          </button>

        </div>
      `;

      dom.results.appendChild(card);

      initSlider(card);

      item.originalURL = originalURL;
      item.processedURL = processedURL;
    });

    dom.zip.disabled = false;
  }

  /* =========================================================
     SLIDER
     ========================================================= */

  function initSlider(card) {

    const compare =
      card.querySelector(".pp-rbg-compare");

    const after =
      card.querySelector(".pp-rbg-after");

    const divider =
      card.querySelector(".pp-rbg-divider");

    let dragging = false;

    function update(x) {

      const rect =
        compare.getBoundingClientRect();

      let ratio =
        (x - rect.left) / rect.width;

      ratio = Math.max(0, Math.min(1, ratio));

      const percent = ratio * 100;

      after.style.clipPath =
        `inset(0 ${100-percent}% 0 0)`;

      divider.style.left = `${percent}%`;
    }

    compare.addEventListener("pointerdown", e => {
      dragging = true;
      update(e.clientX);
    });

    window.addEventListener("pointermove", e => {
      if (!dragging) return;
      update(e.clientX);
    });

    window.addEventListener("pointerup", () => {
      dragging = false;
    });
  }

  /* =========================================================
     APPLY BACKGROUND
     ========================================================= */

  async function applyBackgrounds() {

    const type = dom.bgType.value;

    const feather =
      parseFloat(dom.feather.value);

    const format =
      dom.format.value;

    dom.apply.disabled = true;

    dom.apply.textContent =
      "Applying...";

    for (const item of state.results) {

      if (item.error) continue;

      const cutout =
        await blobToImage(item.cutoutBlob);

      const original =
        await blobToImage(item.originalBlob);

      const canvas =
        document.createElement("canvas");

      canvas.width = cutout.width;
      canvas.height = cutout.height;

      const ctx =
        canvas.getContext("2d");

      /* BACKGROUND */

      if (type === "solid") {

        ctx.fillStyle =
          dom.solidColor.value;

        ctx.fillRect(
          0,0,
          canvas.width,
          canvas.height
        );
      }

      if (type === "gradient") {

        const gradient =
          ctx.createLinearGradient(
            0,0,
            canvas.width,
            canvas.height
          );

        gradient.addColorStop(
          0,
          dom.grad1.value
        );

        gradient.addColorStop(
          1,
          dom.grad2.value
        );

        ctx.fillStyle = gradient;

        ctx.fillRect(
          0,0,
          canvas.width,
          canvas.height
        );
      }

      if (type === "blur") {

        ctx.filter =
          `blur(${dom.blur.value}px)`;

        ctx.drawImage(
          original,
          0,0,
          canvas.width,
          canvas.height
        );

        ctx.filter = "none";
      }

      if (
        type === "custom" &&
        state.customImage
      ) {
        ctx.drawImage(
          state.customImage,
          0,0,
          canvas.width,
          canvas.height
        );
      }

      /* FEATHER */

      if (feather > 0) {

        const featherCanvas =
          document.createElement("canvas");

        featherCanvas.width =
          canvas.width;

        featherCanvas.height =
          canvas.height;

        const featherCtx =
          featherCanvas.getContext("2d");

        featherCtx.filter =
          `blur(${feather}px)`;

        featherCtx.drawImage(
          cutout,
          0,
          0
        );

        featherCtx.filter = "none";

        ctx.drawImage(
          featherCanvas,
          0,
          0
        );

        cleanupCanvas(featherCanvas);
      }

      /* FOREGROUND */

      ctx.drawImage(cutout,0,0);

      item.currentBlob =
        await canvasToBlob(
          canvas,
          format,
          0.95
        );

      cleanupCanvas(canvas);
    }

    renderResults();

    dom.apply.disabled = false;

    dom.apply.textContent =
      "Apply Background";
  }

  /* =========================================================
     DOWNLOAD
     ========================================================= */

  function downloadBlob(blob,name) {

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;
    a.download = name;

    document.body.appendChild(a);

    a.click();

    a.remove();

    setTimeout(() => {
      revoke(url);
    },300);
  }

  /* =========================================================
     SAVE SINGLE
     ========================================================= */

  function saveSingle(index) {

    const item =
      state.results[index];

    if (!item || item.error) return;

    const ext =
      getExtension(dom.format.value);

    downloadBlob(
      item.currentBlob,
      `pixelpress-${safeName(item.file.name)}.${ext}`
    );
  }

  /* =========================================================
     ZIP
     ========================================================= */

  async function downloadZip() {

    const zip = new JSZip();

    const ext =
      getExtension(dom.format.value);

    for (const item of state.results) {

      if (item.error) continue;

      zip.file(
        `pixelpress-${safeName(item.file.name)}.${ext}`,
        item.currentBlob
      );
    }

    const blob =
      await zip.generateAsync({
        type: "blob"
      });

    downloadBlob(
      blob,
      "pixelpress-backgrounds.zip"
    );
  }

  /* =========================================================
     CONTROLS
     ========================================================= */

  function updateControls() {

    const type = dom.bgType.value;

    dom.solidWrap.classList.toggle(
      "pp-rbg-hidden",
      type !== "solid"
    );

    dom.gradientWrap.classList.toggle(
      "pp-rbg-hidden",
      type !== "gradient"
    );

    dom.blurWrap.classList.toggle(
      "pp-rbg-hidden",
      type !== "blur"
    );

    dom.customWrap.classList.toggle(
      "pp-rbg-hidden",
      type !== "custom"
    );

    if (type === "transparent") {
      dom.format.value = "image/png";
    }
  }

  /* =========================================================
     EVENTS
     ========================================================= */

  function bind() {

    dom.dropzone.addEventListener("click", () => {
      dom.input.click();
    });

    dom.dropzone.addEventListener("dragover", e => {
      e.preventDefault();
      dom.dropzone.classList.add("dragging");
    });

    dom.dropzone.addEventListener("dragleave", () => {
      dom.dropzone.classList.remove("dragging");
    });

    dom.dropzone.addEventListener("drop", e => {
      e.preventDefault();

      dom.dropzone.classList.remove("dragging");

      handleFiles(e.dataTransfer.files);
    });

    dom.input.addEventListener("change", e => {
      handleFiles(e.target.files);
    });

    dom.bgType.addEventListener(
      "change",
      updateControls
    );

    dom.blur.addEventListener("input", () => {
      dom.blurValue.textContent =
        `${dom.blur.value}px`;
    });

    dom.feather.addEventListener("input", () => {
      dom.featherValue.textContent =
        `${dom.feather.value}px`;
    });

    dom.customBg.addEventListener(
      "change",
      async e => {

        const file =
          e.target.files[0];

        if (!file) return;

        state.customImage =
          await fileToImage(file);
      }
    );

    dom.apply.addEventListener(
      "click",
      applyBackgrounds
    );

    dom.zip.addEventListener(
      "click",
      downloadZip
    );

    dom.results.addEventListener(
      "click",
      e => {

        const btn =
          e.target.closest(".pp-save-btn");

        if (!btn) return;

        saveSingle(
          Number(btn.dataset.index)
        );
      }
    );
  }

  /* =========================================================
     INIT
     ========================================================= */

  bind();

  updateControls();

})();