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
const BRICK_WIDTH = 220; // 180px width + 40px gap

let bricks = new Map();
let currentUser = null;
let selectedBrick = null;

// Cámara: Cálculo para centrar en el cartel 150 al iniciar
const centerPixel = (CENTER_BRICK * BRICK_WIDTH) - (BRICK_WIDTH / 2) + 200; // +200 por el padding-left
let cameraX = -(centerPixel - window.innerWidth / 2); 
let isDragging = false, startX, clickStartX;
const world = document.getElementById("world");

document.getElementById("viewport").addEventListener("mousedown", (e) => {
  if(e.target.closest('.modal')) return;
  isDragging = true;
  clickStartX = e.clientX;
  startX = e.clientX - cameraX;
});
window.addEventListener("mouseup", () => isDragging = false);
window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  cameraX = e.clientX - startX;
  world.style.transform = `rotateX(60deg) rotateZ(-20deg) translateX(${cameraX}px)`; 
});

document.addEventListener("DOMContentLoaded", () => {
  world.style.transform = `rotateX(60deg) rotateZ(-20deg) translateX(${cameraX}px)`;
  spawnCars();
  spawnStreetlights();
  bindUI();
  loadBricks();
});

function spawnCars() {
  const highway = document.getElementById("highway");
  for (let i = 0; i < 150; i++) {
    const car = document.createElement("div");
    const isRight = Math.random() > 0.5;
    car.className = `car ${isRight ? 'right' : 'left'}`;
    
    // Tonos de coche: oscuro, azulado oscuro, morado oscuro
    const hue = Math.random() > 0.5 ? 200 : 280;
    car.style.borderTopColor = `hsl(${hue}, 50%, 40%)`;
    
    car.style.animationDelay = `-${Math.random() * 400}s`;
    car.style.animationDuration = `${120 + Math.random() * 80}s`;
    highway.appendChild(car);
  }
}

function spawnStreetlights() {
  const container = document.getElementById("streetlights-container");
  for(let i = 0; i < 80; i++) {
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

  for (let i = 1; i <= TOTAL_BRICKS; i++) {
    const data = bricks.get(i) ?? { id: i, claimed: false, color: "#1a1c29" };
    if(data.claimed) occupied++;
    
    const plot = document.createElement("div");
    plot.className = `plot ${data.claimed ? "claimed" : "empty"}`;
    plot.dataset.id = i;
    
    const billboard = document.createElement("div");
    billboard.className = `billboard-frame ${data.founder ? "mega" : ""}`;
    billboard.style.setProperty("--brick-color", data.claimed ? data.color : "#1a1c29");
    
    if (data.claimed) {
      let contentHTML = "";
      if (data.logo) contentHTML += `<img src="${escapeHtml(data.logo)}" class="billboard-logo" onerror="this.style.display='none'">`;
      contentHTML += `<span class="billboard-name">${escapeHtml(data.name.slice(0,15))}</span>`;
      billboard.innerHTML = `<div class="billboard-content">${contentHTML}</div>`;
    } else {
      // Visualmente distinguimos la zona cara (el centro)
      let label = "DISPONIBLE";
      if(i >= 140 && i <= 160) label = "ZONA PREMIUM";
      billboard.innerHTML = `${label}<br>#${i}`; 
    }
    
    plot.appendChild(billboard);
    plot.addEventListener("click", (e) => {
      if(Math.abs(e.clientX - clickStartX) > 5) return;
      openBrick(i);
    });
    container.appendChild(plot);
  }
  document.getElementById("stat-occupied").textContent = occupied;
}

function openBrick(id) {
  const b = bricks.get(id) || { id, claimed: false, color: "#00f0ff" };
  selectedBrick = b;
  document.getElementById("modal-color").style.backgroundColor = b.claimed ? b.color : "#00f0ff";
  document.getElementById("modal-title").textContent = b.claimed ? b.name : `Cartel #${b.id}`;
  
  // Precio simulado según distancia al centro (150)
  const distance = Math.abs(id - CENTER_BRICK);
  let price = 5;
  if(distance < 10) price = 50;
  else if(distance < 50) price = 15;
  
  document.getElementById("modal-desc").textContent = b.claimed ? b.description : `Zona de alto impacto. Alquila este espacio desde ${price}€/mes.`;
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
  for (let i = 1; i <= TOTAL_BRICKS; i++) {
    if (!bricks.get(i)?.claimed) return i;
  }
  return null;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" })[char]);
}
