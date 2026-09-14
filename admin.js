import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');

// Login
document.getElementById('btn-login').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        alert("Error: " + error.message);
    }
});

// Auth State
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
    } else {
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    }
});

// Añadir Producto
document.getElementById('btn-add').addEventListener('click', async () => {
    const titulo = document.getElementById('titulo').value;
    const imagen = document.getElementById('imagen').value;
    const precioActual = parseFloat(document.getElementById('precio-actual').value);
    const precioAnterior = parseFloat(document.getElementById('precio-anterior').value);
    const enlace = document.getElementById('enlace').value;

    if (!titulo || !imagen || !precioActual || !enlace) {
        alert("Rellena los campos obligatorios");
        return;
    }

    try {
        await addDoc(collection(db, "productos"), {
            titulo, imagen, precioActual, precioAnterior, enlace,
            fecha: serverTimestamp()
        });
        alert("¡Chollo publicado!");
        document.querySelectorAll('input').forEach(i => i.value = ''); // Limpiar
    } catch (error) {
        alert("Error al publicar: " + error.message);
    }
});
