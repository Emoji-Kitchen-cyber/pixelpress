const fileInput = document.getElementById("file");
const quality = document.getElementById("quality");
const qv = document.getElementById("qv");
const output = document.getElementById("output");

let files = [];

quality.oninput = () => qv.innerText = quality.value;

fileInput.onchange = (e) => {
files = [...e.target.files];
output.innerHTML = "";
};

function compressImage(file, qualityValue, callback){
const img = new Image();
img.src = URL.createObjectURL(file);

img.onload = () => {
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

canvas.width = img.width;
canvas.height = img.height;

ctx.drawImage(img,0,0);

canvas.toBlob(blob => {
callback(blob);
}, "image/jpeg", qualityValue);
};
}

function compressAll(){
if(files.length === 0) return;

output.innerHTML = "";

files.forEach(file => {
compressImage(file, quality.value/100, (blob)=>{

const url = URL.createObjectURL(blob);

const div = document.createElement("div");
div.innerHTML = `
<p>${file.name}</p>
<img src="${url}">
<br>
<a href="${url}" download="compressed.jpg">
<button>Download</button></a>
<hr>
`;

output.appendChild(div);

});
});
}

function toggleDark(){
document.body.classList.toggle("dark");
}