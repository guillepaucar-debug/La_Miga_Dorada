// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Sustituye estas credenciales con las de tu consola de Firebase
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "lamigadorada.firebaseapp.com",
  projectId: "lamigadorada",
  storageBucket: "lamigadorada.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);