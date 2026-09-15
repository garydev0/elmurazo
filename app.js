import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, doc, getDoc, addDoc, setDoc,
  query, orderBy, limit, runTransaction, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const DEFAULT_SETTINGS = {
  totalBricks: 500,
  wallGap: 2,
  activityEnabled: true,
  activityMin: 80,
  activityMax: 220,
  activityStep: 3,
  activityInterval: 7000
};

let settings = { ...DEFAULT_SETTINGS };
let bricks = new Map();
let activityTimer = null;
let activityValue = null;
let zoom = 1;
let selectedBrick = null;
let currentUser = null;

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
  $("year").textContent = new Date().getFullYear();
  bindUI();
  bootstrap();
});

async function bootstrap() {
  await loadSettings();
  await loadBricks();
  renderWall();
  renderStats();
  startActivityTicker();
}

function bindUI() {
  $("claim-btn").addEventListener("click", () => openClaimModal());
  $("hero-claim-btn").addEventListener("click", () => openClaimModal());
  $("explore-btn").addEventListener("click", () => $("wall-section").scrollIntoView({ behavior: "smooth" }));
  $("login-btn").addEventListener("click", () => openAuth());
  $("google-login").addEventListener("click", loginUser);
  $("logout-btn").addEventListener("click", async () => { await signOut(auth); });
  $("close-modal").addEventListener("click", closeModal);
  $("close-auth").addEventListener("click", closeAuth);
  $("close-claim").addEventListener("click", closeClaim);
  $("modal-claim").addEventListener("click", () => {
    closeModal();
    if (selectedBrick) openClaimModal(selectedBrick.id);
  });
  $("claim-form").addEventListener("submit", handleClaim);
  $("zoom-in").addEventListener("click", () => setZoom(Math.min(1.5, +(zoom + 0.1).toFixed(2))));
  $("zoom-out").addEventListener("click", () => setZoom(Math.max(0.7, +(zoom - 0.1).toFixed(2))));
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) e.target.classList.add("hidden");
  });

  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    $("login-btn").textContent = user ? "ACCOUNT" : "LOGIN";
    $("logout-btn").classList.toggle("hidden", !user);
    $("google-login").classList.toggle("hidden", !!user);
    $("auth-status").textContent = user ? `Signed in as ${user.email}` : "";
  });

  $("claim-color").addEventListener("input", (e) => {
  const brickId = $("claim-brick-id").value;
  if (brickId) {
    const brickEl = document.querySelector(`.brick[data-id="${brickId}"]`);
    if (brickEl) {
      brickEl.style.setProperty("--brick-color", e.target.value);
      brickEl.classList.remove("empty");
      brickEl.classList.add("claimed");
    }
  }
});
}

async function loadSettings() {
  const ref = doc(db, "settings", "public");
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    settings = { ...DEFAULT_SETTINGS };
    return;
  }
  settings = { ...DEFAULT_SETTINGS, ...snap.data() };
}

async function syncMissingBrickDocuments() {
  const existing = await getDocs(query(collection(db, "bricks"), limit(6000)));
  const ids = new Set(existing.docs.map(d => Number(d.id)));
  const total = Number(settings.totalBricks) || DEFAULT_SETTINGS.totalBricks;

  for (let i = 1; i <= total; i++) {
    if (!ids.has(i)) {
      await setDoc(doc(db, "bricks", String(i)), {
        id: i,
        claimed: false,
        name: "",
        description: "",
        link: "",
        color: "#1a1b25",
        founder: false,
        visits: 0,
        ownerUid: "",
        ownerEmail: "",
        createdAt: null,
        updatedAt: serverTimestamp()
      });
    }
  }
}

async function loadBricks() {
  const snap = await getDocs(query(collection(db, "bricks"), orderBy("__name__")));
  bricks = new Map();
  snap.forEach(s => bricks.set(Number(s.id), { id: Number(s.id), ...s.data() }));
}

function renderWall() {
  const wall = $("wall");
  wall.innerHTML = "";
  wall.style.gap = `${settings.wallGap ?? 2}px`;
  const total = Number(settings.totalBricks) || DEFAULT_SETTINGS.totalBricks;
  const columns = window.innerWidth < 650 ? 8 : window.innerWidth < 1000 ? 12 : 18;
  wall.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
  wall.style.transform = `scale(${zoom})`;

  for (let id = 1; id <= total; id++) {
    const data = bricks.get(id) ?? { id, claimed: false, color: "#1a1b25" };
    const el = document.createElement("button");
    el.type = "button";
    el.className = `brick ${data.claimed ? "claimed" : "empty"} ${data.founder ? "founder" : ""}`;
    el.dataset.id = id;
    el.style.setProperty("--brick-color", data.color || "#1a1b25");
    if (data.claimed) {
      const short = (data.name || `#${id}`).slice(0, 12);
      el.innerHTML = `<span class="brick-logo">${escapeHtml(short)}</span>`;
      el.title = `${escapeHtml(data.name || "Claimed brick")} — #${id}`;
    } else {
      el.innerHTML = `<span class="brick-plus">+</span><span class="brick-number">#${id}</span>`;
      el.title = `Available brick #${id}`;
    }
    el.addEventListener("click", () => openBrick(id));
    wall.appendChild(el);
  }
}

function renderStats() {
  let occupied = 0;
  bricks.forEach(b => { if (b.claimed) occupied++; });
  $("stat-occupied").textContent = occupied.toLocaleString();
  $("stat-total").textContent = Number(settings.totalBricks).toLocaleString();
}

function openBrick(id) {
  const b = bricks.get(Number(id));
  selectedBrick = b;
  if (!b) return;

  $("modal-color").style.background = b.color || "#1a1b25";
  $("modal-title").textContent = b.claimed ? (b.name || `Brick #${b.id}`) : "AVAILABLE BRICK";
  $("modal-desc").textContent = b.claimed ? (b.description || "No description.") : "This brick is available. Claim it and leave your mark on the wall.";
  $("modal-id-value").textContent = b.id;
  $("modal-visits").textContent = Number(b.visits || 0).toLocaleString();
  $("modal-status").textContent = b.claimed ? "CLAIMED" : "AVAILABLE";
  $("modal-badge").classList.toggle("hidden", !b.founder);

  const link = $("modal-link");
  if (b.claimed && b.link) {
    link.href = b.link;
    link.classList.remove("hidden");
  } else {
    link.classList.add("hidden");
  }
  $("modal-claim").classList.toggle("hidden", b.claimed);
  $("brick-modal").classList.remove("hidden");
}

function openAuth() {
  $("auth-modal").classList.remove("hidden");
}

async function loginUser() {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    $("auth-status").textContent = cleanAuthError(error);
  }
}

function openClaimModal(brickId = "") {
  $("claim-brick-id").value = brickId;
  $("claim-form").reset();
  $("claim-brick-id").value = brickId;
  $("claim-error").textContent = "";
  $("claim-modal").classList.remove("hidden");
}

async function handleClaim(e) {
  e.preventDefault();
  $("claim-error").textContent = "";

  if (!currentUser) {
    $("claim-error").textContent = "Please sign in first.";
    closeClaim();
    openAuth();
    return;
  }

  const id = Number($("claim-brick-id").value);
  const name = $("claim-name").value.trim();
  const description = $("claim-desc").value.trim();
  const link = $("claim-link").value.trim();
  const color = $("claim-color").value;
  const founder = $("claim-founder").checked;

  if (!name || !description) {
    $("claim-error").textContent = "Name and description are required.";
    return;
  }

  const brickId = id || findFirstAvailableBrick();
  if (!brickId) {
    $("claim-error").textContent = "There are no available bricks.";
    return;
  }

  const ref = doc(db, "bricks", String(brickId));
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error("Brick does not exist.");
      const data = snap.data();
      if (data.claimed) throw new Error("This brick has already been claimed.");
      tx.update(ref, {
        claimed: true,
        name,
        description,
        link,
        color,
        founder,
        visits: 0,
        ownerUid: currentUser.uid,
        ownerEmail: currentUser.email || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    await loadBricks();
    renderWall();
    renderStats();
    closeClaim();
    openBrick(brickId);
  } catch (error) {
    $("claim-error").textContent = error.message || "Could not claim this brick.";
  }
}

function findFirstAvailableBrick() {
  const total = Number(settings.totalBricks) || DEFAULT_SETTINGS.totalBricks;
  for (let i = 1; i <= total; i++) {
    if (!bricks.get(i)?.claimed) return i;
  }
  return null;
}

function setZoom(next) {
  zoom = next;
  $("zoom-label").textContent = `${Math.round(zoom * 100)}%`;
  $("wall").style.transform = `scale(${zoom})`;
}

function startActivityTicker() {
  if (activityTimer) clearInterval(activityTimer);
  if (!settings.activityEnabled) {
    activityValue = 0;
    $("stat-visitors").textContent = "OFF";
    return;
  }

  const min = Number(settings.activityMin);
  const max = Math.max(min, Number(settings.activityMax));
  activityValue = Math.min(max, Math.max(min, Math.round((min + max) / 2)));
  $("stat-visitors").textContent = activityValue.toLocaleString();

  activityTimer = setInterval(() => {
    const direction = Math.random() > 0.5 ? 1 : -1;
    const step = Math.max(1, Number(settings.activityStep) || 1);
    let next = activityValue + direction * step;
    if (next > max) next = Math.max(min, activityValue - step);
    if (next < min) next = Math.min(max, activityValue + step);
    activityValue = next;
    $("stat-visitors").textContent = activityValue.toLocaleString();
  }, Math.max(1000, Number(settings.activityInterval) || 7000));
}

function closeModal() { $("brick-modal").classList.add("hidden"); }
function closeAuth() { $("auth-modal").classList.add("hidden"); }
function closeClaim() { $("claim-modal").classList.add("hidden"); }

function cleanAuthError(error) {
  if (error?.code === "auth/popup-closed-by-user") return "";
  if (error?.code === "auth/unauthorized-domain") return "This domain is not authorized in Firebase Authentication.";
  return "Authentication failed. Check Firebase Authentication settings.";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  })[char]);
}
