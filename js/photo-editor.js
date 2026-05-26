const dropZone =
document.getElementById("dropZone");

const fileInput =
document.getElementById("fileInput");

const uploadSection =
document.getElementById("uploadSection");

const editorSection =
document.getElementById("editorSection");

const canvas =
document.getElementById("canvas");

const ctx =
canvas.getContext("2d");

const brightness =
document.getElementById("brightness");

const contrast =
document.getElementById("contrast");

const saturation =
document.getElementById("saturation");

const rotateLeft =
document.getElementById("rotateLeft");

const rotateRight =
document.getElementById("rotateRight");

const flipH =
document.getElementById("flipH");

const flipV =
document.getElementById("flipV");

const grayscaleBtn =
document.getElementById("grayscaleBtn");

const sepiaBtn =
document.getElementById("sepiaBtn");

const blurBtn =
document.getElementById("blurBtn");

const zoomInBtn =
document.getElementById("zoomInBtn");

const zoomOutBtn =
document.getElementById("zoomOutBtn");

const resetBtn =
document.getElementById("resetBtn");

const downloadBtn =
document.getElementById("downloadBtn");

let originalImage = null;

const state = {

  brightness:100,
  contrast:100,
  saturation:100,

  grayscale:0,
  sepia:0,
  blur:0,

  rotation:0,

  flipX:1,
  flipY:1,

  zoom:1

};

dropZone.addEventListener("click",()=>{

  fileInput.click();

});

dropZone.addEventListener("dragover",(e)=>{

  e.preventDefault();

  dropZone.style.borderColor =
  "#ec4899";

});

dropZone.addEventListener("dragleave",()=>{

  dropZone.style.borderColor =
  "#94a3b8";

});

dropZone.addEventListener("drop",(e)=>{

  e.preventDefault();

  dropZone.style.borderColor =
  "#94a3b8";

  const file =
  e.dataTransfer.files[0];

  if(file){

    loadImage(file);

  }

});

fileInput.addEventListener("change",(e)=>{

  const file =
  e.target.files[0];

  if(file){

    loadImage(file);

  }

});

function loadImage(file){

  const reader =
  new FileReader();

  reader.onload = function(event){

    const img =
    new Image();

    img.onload = function(){

      originalImage = img;

      let width =
      img.width;

      let height =
      img.height;

      const maxWidth = 1200;

      if(width > maxWidth){

        height *=
        maxWidth / width;

        width = maxWidth;

      }

      canvas.width = width;
      canvas.height = height;

      uploadSection.style.display =
      "none";

      editorSection.style.display =
      "block";

      renderCanvas();

    };

    img.src =
    event.target.result;

  };

  reader.readAsDataURL(file);

}

function renderCanvas(){

  if(!originalImage) return;

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.save();

  ctx.translate(
    canvas.width / 2,
    canvas.height / 2
  );

  ctx.rotate(
    state.rotation *
    Math.PI / 180
  );

  ctx.scale(
    state.flipX,
    state.flipY
  );

  ctx.filter = `
    brightness(${state.brightness}%)
    contrast(${state.contrast}%)
    saturate(${state.saturation}%)
    grayscale(${state.grayscale}%)
    sepia(${state.sepia}%)
    blur(${state.blur}px)
  `;

  const drawWidth =
  canvas.width * state.zoom;

  const drawHeight =
  canvas.height * state.zoom;

  ctx.drawImage(
    originalImage,
    -drawWidth / 2,
    -drawHeight / 2,
    drawWidth,
    drawHeight
  );

  ctx.restore();

}

brightness.addEventListener("input",()=>{

  state.brightness =
  brightness.value;

  renderCanvas();

});

contrast.addEventListener("input",()=>{

  state.contrast =
  contrast.value;

  renderCanvas();

});

saturation.addEventListener("input",()=>{

  state.saturation =
  saturation.value;

  renderCanvas();

});

rotateLeft.addEventListener("click",()=>{

  state.rotation -= 90;

  renderCanvas();

});

rotateRight.addEventListener("click",()=>{

  state.rotation += 90;

  renderCanvas();

});

flipH.addEventListener("click",()=>{

  state.flipX *= -1;

  renderCanvas();

});

flipV.addEventListener("click",()=>{

  state.flipY *= -1;

  renderCanvas();

});

grayscaleBtn.addEventListener("click",()=>{

  state.grayscale =
  state.grayscale ? 0 : 100;

  renderCanvas();

});

sepiaBtn.addEventListener("click",()=>{

  state.sepia =
  state.sepia ? 0 : 100;

  renderCanvas();

});

blurBtn.addEventListener("click",()=>{

  state.blur =
  state.blur ? 0 : 3;

  renderCanvas();

});

zoomInBtn.addEventListener("click",()=>{

  state.zoom += 0.1;

  renderCanvas();

});

zoomOutBtn.addEventListener("click",()=>{

  state.zoom -= 0.1;

  if(state.zoom < 0.2){

    state.zoom = 0.2;

  }

  renderCanvas();

});

resetBtn.addEventListener("click",()=>{

  state.brightness = 100;
  state.contrast = 100;
  state.saturation = 100;

  state.grayscale = 0;
  state.sepia = 0;
  state.blur = 0;

  state.rotation = 0;

  state.flipX = 1;
  state.flipY = 1;

  state.zoom = 1;

  brightness.value = 100;
  contrast.value = 100;
  saturation.value = 100;

  renderCanvas();

});

downloadBtn.addEventListener("click",()=>{

  const link =
  document.createElement("a");

  link.download =
  "pixelpress-image.webp";

  link.href =
  canvas.toDataURL(
    "image/webp",
    0.95
  );

  link.click();

});