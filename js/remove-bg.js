(() => {
  "use strict";

  // ======================================================
  // SAFE GLOBALS
  // ======================================================

  const state = {
    results: [],
    processing: false
  };

  // ======================================================
  // DOM
  // ======================================================

  const dropzone = document.getElementById("ppRbgDropzone");
  const input = document.getElementById("ppRbgInput");
  const results = document.getElementById("ppRbgResults");
  const resultsSection = document.getElementById("ppRbgResultsSection");

  // ======================================================
  // LOAD LIBRARY SAFELY
  // ======================================================

  async function loadEngine() {

    if (window.removeBackground) {
      return true;
    }

    try {

      const script = document.createElement("script");

      script.src =
        "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/dist/browser.js";

      script.async = true;

      document.body.appendChild(script);

      await new Promise((resolve, reject) => {

        script.onload = resolve;

        script.onerror = reject;
      });

      return true;

    } catch (err) {

      console.error(err);

      alert("AI engine failed to load.");

      return false;
    }
  }

  // ======================================================
  // IMAGE
  // ======================================================

  function fileToUrl(file) {
    return URL.createObjectURL(file);
  }

  async function processFile(file) {

    const ok = await loadEngine();

    if (!ok) return null;

    try {

      const blob = await window.removeBackground(file, {
        publicPath:
          "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/dist/",
      });

      return blob;

    } catch (err) {

      console.error(err);

      alert("Background removal failed.");

      return null;
    }
  }

  // ======================================================
  // RENDER
  // ======================================================

  function renderCard(originalFile, processedBlob) {

    const originalURL = fileToUrl(originalFile);

    const processedURL =
      URL.createObjectURL(processedBlob);

    const card = document.createElement("div");

    card.className = "pp-rbg-result-card";

    card.innerHTML = `
      <div class="pp-rbg-file-name">
        ${originalFile.name}
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

        <button class="pp-rbg-btn pp-rbg-btn-outline save-btn">
          Save
        </button>

      </div>
    `;

    const saveBtn =
      card.querySelector(".save-btn");

    saveBtn.addEventListener("click", () => {

      const a = document.createElement("a");

      a.href = processedURL;

      a.download =
        originalFile.name.replace(/\.[^/.]+$/, "") +
        "-removed.png";

      a.click();
    });

    results.appendChild(card);

    initSlider(card);
  }

  // ======================================================
  // SLIDER
  // ======================================================

  function initSlider(card) {

    const compare =
      card.querySelector(".pp-rbg-compare");

    const after =
      card.querySelector(".pp-rbg-after");

    const divider =
      card.querySelector(".pp-rbg-divider");

    let active = false;

    function update(x) {

      const rect =
        compare.getBoundingClientRect();

      let percent =
        ((x - rect.left) / rect.width) * 100;

      percent = Math.max(0, Math.min(100, percent));

      after.style.clipPath =
        `inset(0 ${100 - percent}% 0 0)`;

      divider.style.left = percent + "%";
    }

    compare.addEventListener("pointerdown", e => {
      active = true;
      update(e.clientX);
    });

    window.addEventListener("pointermove", e => {
      if (!active) return;
      update(e.clientX);
    });

    window.addEventListener("pointerup", () => {
      active = false;
    });
  }

  // ======================================================
  // PROCESS
  // ======================================================

  async function handleFiles(files) {

    if (state.processing) return;

    state.processing = true;

    results.innerHTML = "";

    const valid =
      Array.from(files)
        .filter(f => f.type.startsWith("image/"))
        .slice(0, 10);

    for (const file of valid) {

      const blob =
        await processFile(file);

      if (blob) {
        renderCard(file, blob);
      }
    }

    resultsSection.classList.remove(
      "pp-rbg-hidden"
    );

    state.processing = false;
  }

  // ======================================================
  // EVENTS
  // ======================================================

  dropzone.addEventListener("click", () => {
    input.click();
  });

  input.addEventListener("change", e => {
    handleFiles(e.target.files);
  });

  dropzone.addEventListener("dragover", e => {
    e.preventDefault();
  });

  dropzone.addEventListener("drop", e => {

    e.preventDefault();

    handleFiles(e.dataTransfer.files);
  });

})();