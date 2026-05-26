const firebaseConfig = {
  apiKey: "AIzaSyD-REPLACE-WITH-YOUR-KEY",
  authDomain: "pixelpress-app.firebaseapp.com",
  projectId: "pixelpress-app",
  storageBucket: "pixelpress-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};

if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
}