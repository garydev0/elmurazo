import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// 1. Configuración de Firebase
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
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', async () => {
    const wall = document.getElementById('wall');
    const totalBricks = 200; // Ladrillos base para el MVP

    // 2. Generar el muro vacío por defecto
    for (let i = 1; i <= totalBricks; i++) {
        const brick = document.createElement('div');
        brick.classList.add('brick', 'empty');
        brick.dataset.id = i;
        brick.textContent = '+';
        brick.addEventListener('click', () => openModal(brick));
        wall.appendChild(brick);
    }

    // 3. (OPCIONAL POR AHORA) Simulación de datos para que no se vea vacío
    // En el siguiente paso cambiaremos esto por: await getDocs(collection(db, "bricks"));
    simularLadrillosOcupados();

    // 4. Lógica del Panel de Información (Modal)
    const modal = document.getElementById('brick-modal');
    const closeBtn = document.getElementById('close-modal');

    function openModal(brick) {
        if (brick.classList.contains('empty')) {
            alert("¡Este ladrillo está vacío! Reclámalo hoy.");
            return;
        }

        document.getElementById('modal-title').textContent = brick.dataset.name;
        document.getElementById('modal-color-header').style.backgroundColor = brick.dataset.color;
        document.getElementById('modal-desc').textContent = brick.dataset.desc;
        document.getElementById('modal-id').textContent = brick.dataset.id;
        document.getElementById('modal-visits').textContent = brick.dataset.visits || 0;

        const badge = document.getElementById('modal-badge');
        brick.dataset.founder === 'true' ? badge.classList.remove('hidden') : badge.classList.add('hidden');

        modal.classList.remove('hidden');
    }

    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });
});

// Función temporal para mantener el diseño vivo antes de conectar la escritura
function simularLadrillosOcupados() {
    const colors = ['#C23B22', '#39FF14', '#00F0FF', '#FFD700', '#9D00FF'];
    const names = ['Gerard', 'TechCorp', 'MemeGod', 'ArtStudio', 'CryptoPunk'];
    let occupiedCount = 0;

    document.querySelectorAll('.brick').forEach(brick => {
        if (Math.random() > 0.7) {
            occupiedCount++;
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const randomName = names[Math.floor(Math.random() * names.length)];
            
            brick.classList.remove('empty');
            brick.style.backgroundColor = randomColor;
            brick.textContent = randomName.substring(0, 5);
            
            brick.dataset.name = randomName;
            brick.dataset.color = randomColor;
            brick.dataset.desc = `Ladrillo de ${randomName}.`;
            brick.dataset.founder = Math.random() > 0.8;
            brick.dataset.visits = Math.floor(Math.random() * 1500);

            if (brick.dataset.founder === 'true') brick.classList.add('founder');
        }
    });

    document.getElementById('stat-occupied').textContent = occupiedCount;
    document.getElementById('stat-visitors').textContent = Math.floor(Math.random() * 5000) + 1000;
}
