import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCFE0T4m16MOyn9JqMujJZZwMJCLen-LgA",
    authDomain: "elmurazo.firebaseapp.com",
    projectId: "elmurazo",
    storageBucket: "elmurazo.firebasestorage.app",
    messagingSenderId: "722334671597",
    appId: "1:722334671597:web:4b316572169de9c66262e4",
    measurementId: "G-P003BX46Z4"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// --- LÓGICA MODO CLARO/OSCURO ---
const themeToggle = document.getElementById('theme-toggle');
const iconSun = document.getElementById('icon-sun');
const iconMoon = document.getElementById('icon-moon');

if(themeToggle) {
    // Cargar preferencia guardada
    if(localStorage.getItem('theme') === 'light') {
        document.body.setAttribute('data-theme', 'light');
        iconSun.style.display = 'none';
        iconMoon.style.display = 'inline-block';
    }

    themeToggle.addEventListener('click', () => {
        if(document.body.getAttribute('data-theme') === 'light') {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'dark');
            iconSun.style.display = 'inline-block';
            iconMoon.style.display = 'none';
        } else {
            document.body.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            iconSun.style.display = 'none';
            iconMoon.style.display = 'inline-block';
        }
    });
}

// --- LÓGICA DEL MURO (index.html) ---
const muroContainer = document.getElementById('muro-container');

if(muroContainer) {
    async function cargarMuro() {
        muroContainer.innerHTML = 'Cargando chollos...';
        try {
            // Ordenamos por fecha, los más nuevos primero
            const q = query(collection(db, "productos"), orderBy("fecha", "desc"));
            const querySnapshot = await getDocs(q);
            muroContainer.innerHTML = '';
            
            querySnapshot.forEach((doc) => {
                const prod = doc.data();
                const ladrillo = document.createElement('div');
                ladrillo.className = 'ladrillo';
                ladrillo.innerHTML = `
                    <img src="${prod.imagen}" alt="${prod.titulo}">
                    <h3>${prod.titulo}</h3>
                    <div class="precio">${prod.precio}</div>
                    <a href="${prod.enlace}" target="_blank" class="btn-comprar">Ver Oferta</a>
                `;
                muroContainer.appendChild(ladrillo);
            });
        } catch (error) {
            console.error("Error cargando el muro:", error);
            muroContainer.innerHTML = 'Error cargando las ofertas.';
        }
    }
    cargarMuro();
}

// --- LÓGICA DE ADMINISTRACIÓN (admin.html) ---
const loginSection = document.getElementById('login-section');
const uploadSection = document.getElementById('upload-section');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');

if (loginSection) {
    // 1. Control de estado de sesión
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Seguridad extra: verificar que eres tú
            if(user.email === "gerardlopezgarcia1@gmail.com") {
                loginSection.style.display = 'none';
                uploadSection.style.display = 'block';
                btnLogout.style.display = 'block';
            } else {
                signOut(auth);
                alert("Acceso denegado: Usuario no autorizado.");
            }
        } else {
            loginSection.style.display = 'block';
            uploadSection.style.display = 'none';
            btnLogout.style.display = 'none';
        }
    });

    // 2. Proceso de Login
    btnLogin.addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const pass = document.getElementById('password').value;
        const errorMsg = document.getElementById('login-error');
        
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (error) {
            errorMsg.textContent = "Error: Credenciales incorrectas.";
        }
    });

    // 3. Proceso de Logout
    btnLogout.addEventListener('click', () => {
        signOut(auth);
    });

    // 4. Subir nuevo producto a Firestore
    const form = document.getElementById('product-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msg = document.getElementById('upload-msg');
        msg.textContent = "Subiendo...";

        try {
            await addDoc(collection(db, "productos"), {
                titulo: document.getElementById('prod-title').value,
                imagen: document.getElementById('prod-img').value,
                precio: document.getElementById('prod-price').value,
                enlace: document.getElementById('prod-link').value,
                fecha: new Date() // Para ordenar de nuevo a viejo
            });
            
            msg.style.color = "green";
            msg.textContent = "¡Ladrillo colgado en el muro con éxito!";
            form.reset();
        } catch (error) {
            console.error(error);
            msg.style.color = "red";
            msg.textContent = "Error al subir el producto.";
        }
    });
}
