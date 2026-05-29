function generateSecurePassword() {
  const length = parseInt(document.getElementById('passLength').value);
  const includeUpper = document.getElementById('upCase').checked;
  const includeNumbers = document.getElementById('numCase').checked;
  const includeSymbols = document.getElementById('symCase').checked;

  let charPool = "abcdefghijklmnopqrstuvwxyz";
  if (includeUpper) charPool += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (includeNumbers) charPool += "0123456789";
  if (includeSymbols) charPool += "!@#$%^&*()_+-=[]{}|;:,.<>?";

  // Prevent pool crash matrix if all checkmarks are cleared by user
  if(charPool === "") charPool = "abcdefghijklmnopqrstuvwxyz";

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
  if (!txt || txt.startsWith("Loading")) return;
  navigator.clipboard.writeText(txt).then(() => {
    alert('Password copied securely to clipboard!');
  }).catch(() => {
    alert('Clipboard transfer intercept error.');
  });
}

const syncThemeMode = () => {
  const theme = localStorage.getItem('pixelpress-theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
};

document.getElementById('passLength').addEventListener('input', (e) => {
  document.getElementById('lenVal').innerText = e.target.value;
});
document.getElementById('generateBtn').addEventListener('click', generateSecurePassword);
document.getElementById('copyBtn').addEventListener('click', copyPassword);

window.addEventListener('DOMContentLoaded', () => {
  syncThemeMode();
  generateSecurePassword();
});
