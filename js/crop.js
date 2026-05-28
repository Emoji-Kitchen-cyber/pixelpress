const fileInput = document.getElementById('fileInput');
const image = document.getElementById('image');
const editor = document.getElementById('editorArea');
let cropper;

document.getElementById('dropZone').onclick = () => fileInput.click();

fileInput.onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    image.src = event.target.result;
    editor.style.display = 'block';
    if(cropper) cropper.destroy();
    cropper = new Cropper(image, { aspectRatio: NaN, viewMode: 1 });
  };
  reader.readAsDataURL(file);
};

document.getElementById('cropBtn').onclick = () => {
  const canvas = cropper.getCroppedCanvas();
  const link = document.createElement('a');
  link.download = 'pixelpress-crop.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
};


