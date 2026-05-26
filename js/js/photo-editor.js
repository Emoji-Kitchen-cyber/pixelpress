const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");

const uploadSection = document.getElementById("uploadSection");
const editorSection = document.getElementById("editorSection");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const brightness = document.getElementById("brightness");
const contrast = document.getElementById("contrast");
const saturation = document.getElementById("saturation");

const rotateLeft = document.getElementById("rotateLeft");
const rotateRight = document.getElementById("rotateRight");

const flipH = document.getElementById("flipH");
const flipV = document.getElementById("flipV");

const resetBtn = document.getElementById("resetBtn");
const downloadBtn = document.getElementById("downloadBtn");

let originalImage = null;

let rotation = 0;
let scaleX = 1;
let scaleY = 1;

dropZone.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", (e) => {

  const file = e.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(event){

    const img = new Image();

    img.onload = function(){

      originalImage = img;

      canvas.width = img.width;
      canvas.height = img.height;

      uploadSection.style.display = "none";
      editorSection.style.display = "block";

      drawImage();
    };

    img.src = event.target.result;
  };

  reader.readAsDataURL(file);

});

function drawImage(){

  if(!originalImage) return;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.save();

  ctx.filter = `
    brightness(${brightness.value}%)
    contrast(${contrast.value}%)
    saturate(${saturation.value}%)
  `;

  ctx.translate(canvas.width/2, canvas.height/2);

  ctx.rotate(rotation * Math.PI / 180);

  ctx.scale(scaleX, scaleY);

  ctx.drawImage(
    originalImage,
    -canvas.width/2,
    -canvas.height/2,
    canvas.width,
    canvas.height
  );

  ctx.restore();

}

brightness.addEventListener("input", drawImage);
contrast.addEventListener("input", drawImage);
saturation.addEventListener("input", drawImage);

rotateLeft.addEventListener("click", () => {
  rotation -= 90;
  drawImage();
});

rotateRight.addEventListener("click", () => {
  rotation += 90;
  drawImage();
});

flipH.addEventListener("click", () => {
  scaleX *= -1;
  drawImage();
});

flipV.addEventListener("click", () => {
  scaleY *= -1;
  drawImage();
});

resetBtn.addEventListener("click", () => {

  brightness.value = 100;
  contrast.value = 100;
  saturation.value = 100;

  rotation = 0;

  scaleX = 1;
  scaleY = 1;

  drawImage();

});

downloadBtn.addEventListener("click", () => {

  const link = document.createElement("a");

  link.download = "pixelpress-image.png";

  link.href = canvas.toDataURL("image/png");

  link.click();

});