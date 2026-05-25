const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const controls = document.getElementById("controls");
const quality = document.getElementById("quality");
const qualityText = document.getElementById("qualityText");
const compressBtn = document.getElementById("compressBtn");
const result = document.getElementById("result");
const sizes = document.getElementById("sizes");
const downloadLink = document.getElementById("downloadLink");

let selectedFile;

quality.addEventListener("input", () => {
  qualityText.innerText = quality.value;
});

fileInput.addEventListener("change", (e) => {
  selectedFile = e.target.files[0];

  if (!selectedFile) return;

  const reader = new FileReader();

  reader.onload = function(event) {
    preview.src = event.target.result;
    preview.style.display = "block";
    controls.style.display = "block";
    result.style.display = "none";
  };

  reader.readAsDataURL(selectedFile);
});

compressBtn.addEventListener("click", () => {
  if (!selectedFile) return;

  const img = new Image();

  img.src = URL.createObjectURL(selectedFile);

  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0);

    const qualityValue = quality.value / 100;

    canvas.toBlob(
      (blob) => {
        const compressedUrl = URL.createObjectURL(blob);

        const originalSize = (selectedFile.size / 1024).toFixed(2);
        const compressedSize = (blob.size / 1024).toFixed(2);

        sizes.innerHTML = `
          Original Size: <b>${originalSize} KB</b><br><br>
          Compressed Size: <b>${compressedSize} KB</b>
        `;

        downloadLink.href = compressedUrl;
        downloadLink.download = "pixelpress-compressed.jpg";

        result.style.display = "block";
      },
      "image/jpeg",
      qualityValue
    );
  };
});