import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export function onAuthChange(callback) { onAuthStateChanged(auth, callback); }
export async function signIn(email, password) { return signInWithEmailAndPassword(auth, email, password); }
export async function signUp(email, password) { return createUserWithEmailAndPassword(auth, email, password); }
export async function logOut() { return signOut(auth); }