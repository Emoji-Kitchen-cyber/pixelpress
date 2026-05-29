function formatJSON() {
  const input = document.getElementById('jsonInput').value;
  const outputBox = document.getElementById('jsonOutput');
  const status = document.getElementById('statusBar');
  
  status.style.display = 'block';
  if (!input.trim()) {
    status.className = "status-bar error";
    status.innerText = "Error: Input string cannot be evaluated empty.";
    outputBox.textContent = "Clean structural object tree output will show here...";
    outputBox.style.color = "#a78bfa";
    return;
  }
  
  try {
    const parsed = JSON.parse(input);
    outputBox.textContent = JSON.stringify(parsed, null, 4);
    outputBox.style.color = "#4ade80";
    status.className = "status-bar success";
    status.innerText = "✓ Valid structural JSON Schema detected.";
  } catch (err) {
    outputBox.textContent = err.name + ": " + err.message;
    outputBox.style.color = "#f87171";
    status.className = "status-bar error";
    status.innerText = "Invalid Object Tree Syntax Structure.";
  }
}

function minifyJSON() {
  const input = document.getElementById('jsonInput').value;
  const outputBox = document.getElementById('jsonOutput');
  const status = document.getElementById('statusBar');
  
  if(!input.trim()) return;
  try {
    const parsed = JSON.parse(input);
    outputBox.textContent = JSON.stringify(parsed);
    outputBox.style.color = "#bae6fd";
    status.className = "status-bar success";
    status.innerText = "✓ JSON structural parsing successfully compressed to single-line string.";
    status.style.display = "block";
  } catch (err) {
    formatJSON();
  }
}

const syncThemeMode = () => {
  const theme = localStorage.getItem('pixelpress-theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
};

document.getElementById('formatBtn').addEventListener('click', formatJSON);
document.getElementById('minifyBtn').addEventListener('click', minifyJSON);
window.addEventListener('DOMContentLoaded', syncThemeMode);
