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

const TOTAL_BRICKS = 300;
const CENTER_BRICK = 150;
const BRICK_WIDTH = 220; // 180px ancho + 40px gap

let bricks = new Map();
let currentUser = null;
let selectedBrick = null;

// Sistema de Cámara Fija Horizontal
let cameraX = 0; 
let isDragging = false, startX, clickStartX;
const world = document.getElementById("world");
const zoneIndicator = document.getElementById("zone-indicator");

// Calcular límites de arrastre para no salirse del mapa
const MAX_X = window.innerWidth / 2;
const MIN_X = -(TOTAL_BRICKS * BRICK_WIDTH) + window.innerWidth / 2;

function setCamera(x) {
  // Clamp (Bloquear) la cámara dentro de los límites del mapa
  cameraX = Math.max(MIN_X, Math.min(MAX_X, x));
  world.style.transform = `rotateX(60deg) rotateZ(-20deg) translateX(${cameraX}px)`;
  updateZoneIndicator();
}

document.getElementById("viewport").addEventListener("mousedown", (e) => {
  if(e.target.closest('.modal')) return;
  isDragging = true;
  clickStartX = e.clientX;
  startX = e.clientX - cameraX;
});
window.addEventListener("mouseup", () => isDragging = false);
window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  setCamera(e.clientX - startX);
});

document.addEventListener("DOMContentLoaded", () => {
  // Empezar en el centro exacto (Cartel 150)
  const centerPixel = -(CENTER_BRICK * BRICK_WIDTH) + window.innerWidth / 2;
  setCamera(centerPixel);
  
  spawnCars();
  bindUI();
  loadBricks();
});

function updateZoneIndicator() {
  const currentPixel = Math.abs(cameraX - window.innerWidth / 2);
  const currentBrick = Math.floor(currentPixel / BRICK_WIDTH);
  
  if (currentBrick >= 130 && currentBrick <= 170) {
    zoneIndicator.textContent = "DISTRITO CENTRAL (PREMIUM)";
    zoneIndicator.style.color = "var(--gold)";
    zoneIndicator.style.borderColor = "var(--gold)";
  } else if (currentBrick < 130) {
    zoneIndicator.textContent = "AUTOPISTA NORTE";
    zoneIndicator.style.color = "var(--cyan)";
    zoneIndicator.style.borderColor = "var(--cyan)";
  } else {
    zoneIndicator.textContent = "DISTRITO SUR";
    zoneIndicator.style.color = "var(--pink)";
    zoneIndicator.style.borderColor = "var(--pink)";
  }
}

function spawnCars() {
  const highway = document.getElementById("highway");
  for (let i = 0; i < 150; i++) {
    const car = document.createElement("div");
    const isRight = Math.random() > 0.5;
    car.className = `car ${isRight ? 'right' : 'left'}`;
    
    // Tonos Cyberpunk
    const hue = Math.random() > 0.5 ? 190 : 320; 
    car.style.borderTopColor = `hsl(${hue}, 80%, 40%)`;
    
    car.style.animationDelay = `-${Math.random() * 500}s`;
    car.style.animationDuration = `${120 + Math.random() * 80}s`;
    highway.appendChild(car);
  }
}

function bindUI() {
  document.getElementById("login-btn").addEventListener("click", () => document.getElementById("auth-modal").classList.remove("hidden"));
  document.getElementById("google-login").addEventListener("click", () => signInWithPopup(auth, provider));
  document.getElementById("logout-btn").addEventListener("click", () => signOut(auth));
  document.getElementById("close-auth").addEventListener("click", () => document.getElementById("auth-modal").classList.add("hidden"));
  document.getElementById("close-modal").addEventListener("click", () => document.getElementById("brick-modal").classList.add("hidden"));
  
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
  });

  function updatePreview() {
    const brickId = document.getElementById("claim-brick-id").value;
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

function getPriceForBrick(id) {
  const distance = Math.abs(id - CENTER_BRICK);
  if (distance <= 20) return 50; // Premium Central
  if (distance <= 75) return 15; // Neón Medio
  return 5; // Estándar Extremos
}

function renderWall() {
  const container = document.getElementById("plots-container");
  container.innerHTML = "";
  let occupied = 0;

  for (let i = 1; i <= TOTAL_BRICKS; i++) {
    const data = bricks.get(i) ?? { id: i, claimed: false, color: "#1a1c29" };
    if(data.claimed) occupied++;
    
    const isPremium = Math.abs(i - CENTER_BRICK) <= 20;
    
    const plot = document.createElement("div");
    plot.className = `plot ${data.claimed ? "claimed" : "empty"} ${isPremium ? "zone-premium" : ""}`;
    plot.dataset.id = i;
    
    const billboard = document.createElement("div");
    billboard.className = `billboard-frame ${data.founder ? "mega" : ""}`;
    billboard.style.setProperty("--brick-color", data.claimed ? data.color : (isPremium ? "#ffaa00" : "#1a1c29"));
    
    if (data.claimed) {
      let contentHTML = "";
      if (data.logo) contentHTML += `<img src="${escapeHtml(data.logo)}" class="billboard-logo" onerror="this.style.display='none'">`;
      contentHTML += `<span class="billboard-name">${escapeHtml(data.name.slice(0,15))}</span>`;
      billboard.innerHTML = `<div class="billboard-content">${contentHTML}</div>`;
    } else {
      billboard.innerHTML = `${isPremium ? 'PREMIUM' : 'DISPONIBLE'}<br>#${i}`; 
    }
    
    plot.appendChild(billboard);
    plot.addEventListener("click", (e) => {
      if(Math.abs(e.clientX - clickStartX) > 5) return; // Evitar clic al arrastrar
      openBrick(i);
    });
    container.appendChild(plot);
  }
  document.getElementById("stat-occupied").textContent = occupied;
}

function openBrick(id) {
  const b = bricks.get(id) || { id, claimed: false, color: "#00e5ff" };
  selectedBrick = b;
  const isPremium = Math.abs(id - CENTER_BRICK) <= 20;
  
  document.getElementById("modal-color").style.backgroundColor = b.claimed ? b.color : (isPremium ? "#ffaa00" : "#00e5ff");
  document.getElementById("modal-title").textContent = b.claimed ? b.name : `Cartel #${b.id}`;
  
  const price = getPriceForBrick(id);
  document.getElementById("modal-price").textContent = `${price}€/mes`;
  
  document.getElementById("modal-desc").textContent = b.claimed ? b.description : `Reserva este espacio en la autopista digital.`;
  document.getElementById("modal-id-value").textContent = b.id;
  document.getElementById("modal-status").textContent = b.claimed ? "ALQUILADO" : "LIBRE";
  document.getElementById("modal-status").className = b.claimed ? "" : "status-free";
  
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
  const defColor = Math.abs(brickId - CENTER_BRICK) <= 20 ? "#ffaa00" : "#00e5ff";
  document.getElementById("claim-color").value = defColor;
  document.getElementById("claim-color").style.backgroundColor = defColor;
  document.getElementById("claim-error").textContent = "";
  document.getElementById("claim-modal").classList.remove("hidden");
}

async function handleClaim(e) {
  e.preventDefault();
  if (!currentUser) {
    document.getElementById("claim-error").textContent = "Debes iniciar sesión para reservar.";
    return;
  }
  
  const id = Number(document.getElementById("claim-brick-id").value);
  const ref = doc(db, "bricks", String(id));
  
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists() && snap.data().claimed) throw new Error("Este cartel ya ha sido reservado.");
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
    document.getElementById("claim-error").textContent = err.message || "Error al procesar la reserva.";
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" })[char]);
}
