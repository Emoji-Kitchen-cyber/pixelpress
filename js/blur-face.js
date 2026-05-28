const input = document.getElementById('fileInput');
const canvas = document.getElementById('canvas');

document.getElementById('dropZone').onclick = () => input.click();

input.onchange = async (e) => {
  const file = e.target.files[0];
  const img = await faceapi.bufferToImage(file);
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // Load model & detect
  await faceapi.nets.tinyFaceDetector.loadFromUri('https://vladmandic.github.io/face-api/model/');
  const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions());

  // Apply Blur
  ctx.filter = 'blur(20px)';
  detections.forEach(d => {
    const {x, y, width, height} = d.box;
    ctx.drawImage(img, x, y, width, height, x, y, width, height); // Copy image to self
    ctx.fillRect(x, y, width, height); // Apply blur
  });
  alert("Faces detected and blurred!");
};
