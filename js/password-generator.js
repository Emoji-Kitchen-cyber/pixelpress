function generateSecurePassword() {
  const lengthInput = document.getElementById('passLength');
  if (!lengthInput) return; // Failsafe
  
  const length = parseInt(lengthInput.value);
  const includeUpper = document.getElementById('upCase').checked;
  const includeNumbers = document.getElementById('numCase').checked;
  const includeSymbols = document.getElementById('symCase').checked;

  let charPool = "abcdefghijklmnopqrstuvwxyz";
  if (includeUpper) charPool += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (includeNumbers) charPool += "0123456789";
  if (includeSymbols) charPool += "!@#$%^&*()_+-=[]{}|;:,.<>?";

  if(charPool === "") charPool = "abcdefghijklmnopqrstuvwxyz"; // Fallback

  let password = "";
  const cryptoArray = new Uint32Array(length);
  window.crypto.getRandomValues(cryptoArray);

  for (let i = 0; i < length; i++) {
    password += charPool[cryptoArray[i] % charPool.length];
  }
  document.getElementById('passwordOutput').innerText = password;
}

function copyPassword() {
  const txt = document.getElementById('passwordOutput').innerText;
  if (!txt || txt === "Loading...") return;
  
  navigator.clipboard.writeText(txt).then(() => {
    alert('Password copied securely!');
  }).catch(() => {
    // Fallback for older devices/browsers
    const tempInput = document.createElement("input");
    tempInput.value = txt;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
    alert('Password copied securely!');
  });
}

function syncThemeMode() {
  const theme = localStorage.getItem('pixelpress-theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
}

// Attach Events
document.getElementById('passLength').addEventListener('input', (e) => {
  document.getElementById('lenVal').innerText = e.target.value;
});
document.getElementById('generateBtn').addEventListener('click', generateSecurePassword);
document.getElementById('copyBtn').addEventListener('click', copyPassword);

// Direct Execution
syncThemeMode();
generateSecurePassword();
