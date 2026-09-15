import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc,
  query, orderBy, limit, serverTimestamp, writeBatch
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCFEQ0T4m16MOyn9JqMujJZZwMJCLen-LgA",
  authDomain: "elmurazo.firebaseapp.com",
  projectId: "elmurazo",
  storageBucket: "elmurazo.firebasestorage.app",
  messagingSenderId: "722334671597",
  appId: "1:722334671597:web:4b316572169de9c66262e4",
  measurementId: "G-P003BX46Z4"
};

// Set this to the exact Google account that must have admin access.
const ADMIN_EMAIL = "REPLACE_WITH_YOUR_EMAIL@example.com";

const DEFAULT_SETTINGS = {
  totalBricks: 500,
  wallGap: 2,
  activityEnabled: true,
  activityMin: 80,
  activityMax: 220,
  activityStep: 3,
  activityInterval: 7000
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let settings = { ...DEFAULT_SETTINGS };
let allBricks = [];
let selectedId = null;

const $ = (id) => document.getElementById(id);

$("admin-google-login").addEventListener("click", async () => {
  $("login-message").textContent = "";
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    $("login-message").textContent = cleanAuthError(error);
  }
});

$("admin-logout").addEventListener("click", () => signOut(auth));
$("save-activity").addEventListener("click", saveActivity);
$("save-wall").addEventListener("click", saveWall);
$("seed-bricks").addEventListener("click", syncBricks);
$("brick-search").addEventListener("input", renderTable);
$("brick-editor-form").addEventListener("submit", saveBrick);
$("delete-brick").addEventListener("click", deleteBrick);

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    showLoggedOut();
    return;
  }

  if (!ADMIN_EMAIL || ADMIN_EMAIL.includes("REPLACE_WITH")) {
    await signOut(auth);
    $("login-message").textContent = "Set ADMIN_EMAIL in admin.js before using the admin dashboard.";
    return;
  }

  if ((user.email || "").toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    await signOut(auth);
    $("login-message").textContent = "This Google account is not authorized for administration.";
    return;
  }

  $("admin-email").textContent = user.email;
  showLoggedIn();
  await loadDashboard();
});

function showLoggedIn() {
  $("login-screen").classList.add("hidden");
  $("admin-app").classList.remove("hidden");
}

function showLoggedOut() {
  $("login-screen").classList.remove("hidden");
  $("admin-app").classList.add("hidden");
}

async function loadDashboard() {
  const settingsSnap = await getDoc(doc(db, "settings", "public"));
  if (settingsSnap.exists()) {
    settings = { ...DEFAULT_SETTINGS, ...settingsSnap.data() };
  } else {
    settings = { ...DEFAULT_SETTINGS };
    await setDoc(doc(db, "settings", "public"), settings);
  }

  fillSettings();

  const snap = await getDocs(query(collection(db, "bricks"), orderBy("__name__"), limit(6000)));
  allBricks = snap.docs.map(d => ({ id: Number(d.id), ...d.data() }));
  renderTable();
  renderKpis();
}

function fillSettings() {
  $("activity-min").value = Number(settings.activityMin);
  $("activity-max").value = Number(settings.activityMax);
  $("activity-step").value = Number(settings.activityStep);
  $("activity-interval").value = Number(settings.activityInterval);
  $("activity-enabled").checked = !!settings.activityEnabled;
  $("wall-total").value = Number(settings.totalBricks);
  $("wall-gap").value = Number(settings.wallGap);
}

async function saveActivity() {
  const min = Math.max(0, Number($("activity-min").value));
  const max = Math.max(min, Number($("activity-max").value));
  const step = Math.max(1, Number($("activity-step").value));
  const interval = Math.max(1000, Number($("activity-interval").value));
  const activityEnabled = $("activity-enabled").checked;

  settings = { ...settings, activityMin: min, activityMax: max, activityStep: step, activityInterval: interval, activityEnabled };
  await setDoc(doc(db, "settings", "public"), settings, { merge: true });
  showSaved($("activity-save-msg"));
}

async function saveWall() {
  const totalBricks = Math.max(1, Math.min(5000, Number($("wall-total").value)));
  const wallGap = Math.max(0, Math.min(8, Number($("wall-gap").value)));

  settings = { ...settings, totalBricks, wallGap };
  await setDoc(doc(db, "settings", "public"), settings, { merge: true });
  await syncBricks();
  showSaved($("wall-save-msg"));
}

async function syncBricks() {
  const total = Number(settings.totalBricks);
  const currentIds = new Set(allBricks.map(b => b.id));
  let batch = writeBatch(db);
  let writes = 0;

  for (let i = 1; i <= total; i++) {
    if (!currentIds.has(i)) {
      batch.set(doc(db, "bricks", String(i)), {
        id: i, claimed: false, name: "", description: "", link: "",
        color: "#1a1b25", founder: false, visits: 0,
        ownerUid: "", ownerEmail: "", createdAt: null, updatedAt: serverTimestamp()
      });
      writes++;

      if (writes >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        writes = 0;
      }
    }
  }

  if (writes > 0) await batch.commit();
  await loadDashboard();
}
function renderKpis() {
  const claimed = allBricks.filter(b => b.claimed).length;
  $("kpi-claimed").textContent = claimed.toLocaleString();
  $("kpi-available").textContent = Math.max(0, Number(settings.totalBricks) - claimed).toLocaleString();
  $("kpi-activity").textContent = settings.activityEnabled ? `${settings.activityMin}–${settings.activityMax}` : "OFF";
  $("kpi-size").textContent = Number(settings.totalBricks).toLocaleString();
}

function renderTable() {
  const body = $("brick-table-body");
  const search = $("brick-search").value.trim().toLowerCase();
  body.innerHTML = "";

  const list = allBricks
    .filter(b => !search || String(b.id).includes(search) || String(b.name || "").toLowerCase().includes(search))
    .slice(0, 1000);

  for (const b of list) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>#${b.id}</td>
      <td><span class="status-dot ${b.claimed ? "on" : ""}"></span>${b.claimed ? "Claimed" : "Available"}</td>
      <td>${escapeHtml(b.name || "—")}</td>
      <td>${b.founder ? "YES" : "—"}</td>
      <td>${Number(b.visits || 0).toLocaleString()}</td>
      <td><button class="table-btn" data-id="${b.id}">EDIT</button></td>
    `;
    tr.querySelector("button").addEventListener("click", () => selectBrick(b.id));
    body.appendChild(tr);
  }
}

function selectBrick(id) {
  const b = allBricks.find(x => x.id === Number(id));
  if (!b) return;
  selectedId = b.id;

  $("editor-status").textContent = `EDITING #${b.id}`;
  $("edit-id").value = b.id;
  $("edit-brick-id").value = b.id;
  $("edit-name").value = b.name || "";
  $("edit-visits").value = Number(b.visits || 0);
  $("edit-color").value = b.color || "#c23b22";
  $("edit-desc").value = b.description || "";
  $("edit-link").value = b.link || "";
  $("edit-claimed").checked = !!b.claimed;
  $("edit-founder").checked = !!b.founder;

  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

async function saveBrick(e) {
  e.preventDefault();
  if (!selectedId) {
    $("editor-msg").textContent = "Select a brick first.";
    return;
  }

  const id = Number(selectedId);
  await updateDoc(doc(db, "bricks", String(id)), {
    claimed: $("edit-claimed").checked,
    name: $("edit-name").value.trim(),
    visits: Math.max(0, Number($("edit-visits").value)),
    color: $("edit-color").value,
    description: $("edit-desc").value.trim(),
    link: $("edit-link").value.trim(),
    founder: $("edit-founder").checked,
    updatedAt: serverTimestamp()
  });

  showSaved($("editor-msg"));
  await loadDashboard();
  selectBrick(id);
}

async function deleteBrick() {
  if (!selectedId) return;
  if (!confirm(`Delete all data for brick #${selectedId}?`)) return;
  await deleteDoc(doc(db, "bricks", String(selectedId)));
  selectedId = null;
  $("editor-status").textContent = "NONE SELECTED";
  $("brick-editor-form").reset();
  $("edit-brick-id").value = "";
  await loadDashboard();
  $("editor-msg").textContent = "Deleted.";
}

function showSaved(node) {
  node.textContent = "Saved.";
  setTimeout(() => node.textContent = "", 2000);
}

function cleanAuthError(error) {
  if (error?.code === "auth/unauthorized-domain") return "This domain is not authorized in Firebase.";
  return "Authentication failed.";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  })[char]);
}
