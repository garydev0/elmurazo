import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

// REEMPLAZA ESTO CON LOS DATOS DE TU PROYECTO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCFE0T4m16MOyn9JqMujJZZwMJCLen-LgA",
  authDomain: "elmurazo.firebaseapp.com",
  projectId: "elmurazo",
  storageBucket: "elmurazo.firebasestorage.app",
  messagingSenderId: "722334671597",
  appId: "1:722334671597:web:4b316572169de9c66262e4",
  measurementId: "G-P003BX46Z4"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
