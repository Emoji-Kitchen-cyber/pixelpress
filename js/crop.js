const input = document.getElementById('fileInput');
const img = document.getElementById('img');
let cropper;
input.onchange = (e) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    img.src = e.target.result;
    document.getElementById('editor').style.display = 'block';
    cropper = new Cropper(img, { aspectRatio: NaN });
  };
  reader.readAsDataURL(e.target.files[0]);
};
document.getElementById('save').onclick = () => {
  const canvas = cropper.getCroppedCanvas();
  const link = document.createElement('a');
  link.download = 'cropped.png';
  link.href = canvas.toDataURL();
  link.click();
};

