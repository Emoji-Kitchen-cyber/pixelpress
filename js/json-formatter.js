function formatJSON() {
  const inputEl = document.getElementById('jsonInput');
  const outputBox = document.getElementById('jsonOutput');
  const status = document.getElementById('statusBar');
  
  if(!inputEl || !outputBox || !status) return;

  const input = inputEl.value;
  status.style.display = 'block';
  
  if (!input.trim()) {
    status.className = "status-bar error";
    status.innerText = "Error: Input cannot be empty.";
    outputBox.textContent = "Result will show here...";
    outputBox.style.color = "#a78bfa";
    return;
  }
  
  try {
    const parsed = JSON.parse(input);
    outputBox.textContent = JSON.stringify(parsed, null, 4);
    outputBox.style.color = "#4ade80"; // Light green for valid JSON
    status.className = "status-bar success";
    status.innerText = "✓ Valid JSON detected and formatted.";
  } catch (err) {
    outputBox.textContent = err.name + ": " + err.message;
    outputBox.style.color = "#f87171"; // Red for error
    status.className = "status-bar error";
    status.innerText = "Invalid JSON syntax.";
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
    status.innerText = "✓ JSON successfully minified.";
    status.style.display = "block";
  } catch (err) {
    // If invalid, just trigger the format function to show the error
    formatJSON();
  }
}

function syncThemeMode() {
  const theme = localStorage.getItem('pixelpress-theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
}

// Attach Events
document.getElementById('formatBtn').addEventListener('click', formatJSON);
document.getElementById('minifyBtn').addEventListener('click', minifyJSON);

// Direct Execution
syncThemeMode();
