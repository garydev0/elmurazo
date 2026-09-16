import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, query, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCFE0T4m16MOyn9JqMujJZZwMJCLen-LgA",
  authDomain: "elmurazo.firebaseapp.com",
  projectId: "elmurazo",
  storageBucket: "elmurazo.firebasestorage.app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let bricks = new Map();
let currentUser = null;
let selectedBrick = null;

// Cámara: Bloqueada solo en el Eje X (Movimiento lateral exclusivo)
let cameraX = 0; 
let isDragging = false, startX;
const camera = document.getElementById("camera");

document.getElementById("viewport").addEventListener("mousedown", (e) => {
  if(e.target.closest('.modal')) return;
  isDragging = true;
  startX = e.clientX - cameraX;
});
window.addEventListener("mouseup", () => isDragging = false);
window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  cameraX = e.clientX - startX;
  // translateY se mantiene fijo para evitar saltos o zoom indeseado
  camera.style.transform = `translateX(${cameraX}px) translateY(120px)`; 
});

document.addEventListener("DOMContentLoaded", () => {
  camera.style.transform = `translateX(${cameraX}px) translateY(120px)`;
  spawnCars();
  spawnStreetlights();
  bindUI();
  loadBricks();
});

function spawnCars() {
  const highway = document.getElementById("highway");
  for (let i = 0; i < 60; i++) {
    const car = document.createElement("div");
    const isRight = Math.random() > 0.5;
    const hue = Math.floor(Math.random() * 360);
    const color = `hsl(${hue}, 80%, 60%)`;
    
    car.className = `car ${isRight ? 'right' : 'left'}`;
    car.style.backgroundColor = color;
    
    // Luces delanteras blancas y traseras rojas dependiendo de la dirección
    if (isRight) {
      car.style.boxShadow = `15px 0 15px #fff, -15px 0 10px red, 0 0 20px ${color}`;
    } else {
      car.style.boxShadow = `-15px 0 15px #fff, 15px 0 10px red, 0 0 20px ${color}`;
    }
    
    car.style.animationDelay = `-${Math.random() * 300}s`;
    car.style.animationDuration = `${80 + Math.random() * 60}s`;
    highway.appendChild(car);
  }
}

function spawnStreetlights() {
  const container = document.getElementById("streetlights-container");
  for(let i = 0; i < 50; i++) {
    const light = document.createElement("div");
    light.className = "streetlight";
    container.appendChild(light);
  }
}

function bindUI() {
  document.getElementById("login-btn").addEventListener("click", () => document.getElementById("auth-modal").classList.remove("hidden"));
  document.getElementById("google-login").addEventListener("click", () => signInWithPopup(auth, provider));
  document.getElementById("logout-btn").addEventListener("click", () => signOut(auth));
  document.getElementById("close-auth").addEventListener("click", () => document.getElementById("auth-modal").classList.add("hidden"));
  document.getElementById("close-modal").addEventListener("click", () => document.getElementById("brick-modal").classList.add("hidden"));
  document.getElementById("claim-btn").addEventListener("click", () => openClaimModal(""));
  document.getElementById("close-claim").addEventListener("click", () => {
    document.getElementById("claim-modal").classList.add("hidden");
    renderWall(); 
  });
  document.getElementById("modal-claim").addEventListener("click", () => {
    document.getElementById("brick-modal").classList.add("hidden");
    if (selectedBrick) openClaimModal(selectedBrick.id);
  });
  document.getElementById("claim-form").addEventListener("submit", handleClaim);

  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    document.getElementById("login-btn").textContent = user ? "CUENTA" : "LOGIN";
    document.getElementById("logout-btn").classList.toggle("hidden", !user);
    document.getElementById("google-login").classList.toggle("hidden", !!user);
    document.getElementById("auth-status").textContent = user ? `Conectado como ${user.email}` : "";
  });

  function updatePreview() {
    const brickId = document.getElementById("claim-brick-id").value || findFirstAvailableBrick();
    if (!brickId) return;
    const plot = document.querySelector(`.plot[data-id="${brickId}"]`);
    if (!plot) return;

    plot.classList.remove("empty"); 
    plot.classList.add("claimed");

    const billboard = plot.querySelector('.billboard-frame');
    const color = document.getElementById("claim-color").value;
    const isMega = document.getElementById("claim-founder").checked;
    const logoUrl = document.getElementById("claim-logo").value.trim();
    const name = document.getElementById("claim-name").value.trim() || "PREVISUALIZACIÓN";

    document.getElementById("claim-color").style.backgroundColor = color;
    billboard.style.setProperty("--brick-color", color);
    
    if(isMega) billboard.classList.add("mega");
    else billboard.classList.remove("mega");

    let contentHTML = "";
    if (logoUrl) contentHTML += `<img src="${escapeHtml(logoUrl)}" class="billboard-logo" onerror="this.style.display='none'">`;
    contentHTML += `<span class="billboard-name">${escapeHtml(name.slice(0, 15))}</span>`;
    billboard.innerHTML = `<div class="billboard-content">${contentHTML}</div>`;
  }

  document.getElementById("claim-color").addEventListener("input", updatePreview);
  document.getElementById("claim-name").addEventListener("input", updatePreview);
  document.getElementById("claim-logo").addEventListener("input", updatePreview);
  document.getElementById("claim-founder").addEventListener("change", updatePreview);
}

async function loadBricks() {
  const snap = await getDocs(query(collection(db, "bricks")));
  snap.forEach(s => bricks.set(Number(s.id), { id: Number(s.id), ...s.data() }));
  renderWall();
}

function renderWall() {
  const container = document.getElementById("plots-container");
  container.innerHTML = "";
  let occupied = 0;

  for (let i = 1; i <= 500; i++) {
    const data = bricks.get(i) ?? { id: i, claimed: false, color: "#444" };
    if(data.claimed) occupied++;
    
    const plot = document.createElement("div");
    plot.className = `plot ${data.claimed ? "claimed" : "empty"}`;
    plot.dataset.id = i;
    
    const billboard = document.createElement("div");
    billboard.className = `billboard-frame ${data.founder ? "mega" : ""}`;
    billboard.style.setProperty("--brick-color", data.claimed ? data.color : "#444");
    
    if (data.claimed) {
      let contentHTML = "";
      if (data.logo) contentHTML += `<img src="${escapeHtml(data.logo)}" class="billboard-logo" onerror="this.style.display='none'">`;
      contentHTML += `<span class="billboard-name">${escapeHtml(data.name.slice(0,15))}</span>`;
      billboard.innerHTML = `<div class="billboard-content">${contentHTML}</div>`;
    } else {
      billboard.innerHTML = `DISPONIBLE<br>#${i}`; 
    }
    
    plot.appendChild(billboard);
    plot.addEventListener("click", (e) => {
      // Ignorar el clic si se estaba arrastrando
      if(isDragging && (Math.abs(e.clientX - startX - cameraX) > 5)) return;
      openBrick(i);
    });
    container.appendChild(plot);
  }
  document.getElementById("stat-occupied").textContent = occupied;
}

function openBrick(id) {
  const b = bricks.get(id) || { id, claimed: false, color: "#444" };
  selectedBrick = b;
  document.getElementById("modal-color").style.backgroundColor = b.color;
  document.getElementById("modal-title").textContent = b.claimed ? b.name : "Cartel Disponible";
  document.getElementById("modal-desc").textContent = b.claimed ? b.description : "Anuncia tu proyecto en esta valla.";
  document.getElementById("modal-id-value").textContent = b.id;
  document.getElementById("modal-visits").textContent = b.visits || 0;
  document.getElementById("modal-status").textContent = b.claimed ? "ALQUILADO" : "LIBRE";
  
  const linkBtn = document.getElementById("modal-link");
  if (b.claimed && b.link) {
    linkBtn.href = b.link;
    linkBtn.classList.remove("hidden");
  } else {
    linkBtn.classList.add("hidden");
  }
  
  document.getElementById("modal-claim").classList.toggle("hidden", b.claimed);
  document.getElementById("brick-modal").classList.remove("hidden");
}

function openClaimModal(brickId) {
  document.getElementById("claim-brick-id").value = brickId;
  document.getElementById("claim-form").reset();
  document.getElementById("claim-logo").value = "";
  const defColor = "#00f0ff";
  document.getElementById("claim-color").value = defColor;
  document.getElementById("claim-color").style.backgroundColor = defColor;
  document.getElementById("claim-error").textContent = "";
  document.getElementById("claim-modal").classList.remove("hidden");
}

async function handleClaim(e) {
  e.preventDefault();
  if (!currentUser) {
    document.getElementById("claim-error").textContent = "Inicia sesión primero.";
    return;
  }
  
  const id = Number(document.getElementById("claim-brick-id").value) || findFirstAvailableBrick();
  const ref = doc(db, "bricks", String(id));
  
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists() && snap.data().claimed) throw new Error("Ya está alquilado.");
      tx.set(ref, {
        id, claimed: true,
        name: document.getElementById("claim-name").value.trim(),
        description: document.getElementById("claim-desc").value.trim(),
        link: document.getElementById("claim-link").value.trim(),
        logo: document.getElementById("claim-logo").value.trim(),
        color: document.getElementById("claim-color").value,
        founder: document.getElementById("claim-founder").checked,
        visits: 0, ownerUid: currentUser.uid, updatedAt: serverTimestamp()
      }, {merge: true});
    });
    document.getElementById("claim-modal").classList.add("hidden");
    await loadBricks();
    openBrick(id);
  } catch (err) {
    document.getElementById("claim-error").textContent = err.message || "Error al alquilar.";
  }
}

function findFirstAvailableBrick() {
  for (let i = 1; i <= 500; i++) {
    if (!bricks.get(i)?.claimed) return i;
  }
  return null;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" })[char]);
}
