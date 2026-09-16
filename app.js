import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCFE0T4m16MOyn9JqMujJZZwMJCLen-LgA",
  authDomain: "elmurazo.firebaseapp.com",
  projectId: "elmurazo",
  storageBucket: "elmurazo.firebasestorage.app",
  messagingSenderId: "722334671597",
  appId: "1:722334671597:web:4b316572169de9c66262e4",
  measurementId: "G-P003BX46Z4"
};

const ADMIN_EMAIL = "gerardlopezgarcia1@gmail.com";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const $ = (selector, root = document) => root.querySelector(selector);

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeProduct(docSnap) {
  const data = docSnap.data() || {};
  let millis = 0;
  if (data.fecha?.toMillis) millis = data.fecha.toMillis();
  else if (data.fecha?.seconds) millis = data.fecha.seconds * 1000;
  else if (data.fecha instanceof Date) millis = data.fecha.getTime();
  return {
    id: docSnap.id,
    titulo: String(data.titulo || "Sin título"),
    imagen: String(data.imagen || ""),
    precio: String(data.precio || ""),
    enlace: String(data.enlace || "#"),
    fechaMillis: millis
  };
}

function safeUrl(value, fallback = "#") {
  try {
    const url = new URL(String(value || ""), window.location.href);
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
  } catch (_) {}
  return fallback;
}

let allProducts = [];
let unsubscribeProducts = null;

function setupTheme() {
  const button = $("#theme-toggle");
  const icon = $("#theme-icon");
  if (!button || !icon) return;

  const stored = localStorage.getItem("elmurazo-theme");
  if (stored === "light") document.documentElement.dataset.theme = "light";

  const syncIcon = () => {
    icon.textContent = document.documentElement.dataset.theme === "light" ? "☀" : "☾";
  };
  syncIcon();

  button.addEventListener("click", () => {
    const isLight = document.documentElement.dataset.theme === "light";
    if (isLight) {
      delete document.documentElement.dataset.theme;
      localStorage.setItem("elmurazo-theme", "dark");
    } else {
      document.documentElement.dataset.theme = "light";
      localStorage.setItem("elmurazo-theme", "light");
    }
    syncIcon();
  });
}

function setupBaseUi() {
  const year = $("#current-year");
  if (year) year.textContent = new Date().getFullYear();
  setupTheme();
}

function createProductCard(product) {
  const article = document.createElement("article");
  article.className = "product-card";
  const image = safeUrl(product.imagen, "https://placehold.co/900x700/111318/ffffff?text=El+Murazo");

  article.innerHTML = `
    <a class="product-image-wrap" href="${escapeHtml(safeUrl(product.enlace))}" target="_blank" rel="noopener noreferrer sponsored" aria-label="Ver oferta de ${escapeHtml(product.titulo)}">
      <img class="product-image" src="${escapeHtml(image)}" alt="" loading="lazy" referrerpolicy="no-referrer">
      <span class="deal-badge">OFERTA</span>
    </a>
    <div class="product-body">
      <h2 class="product-title">${escapeHtml(product.titulo)}</h2>
      <div class="product-footer">
        <strong class="product-price">${escapeHtml(product.precio)}</strong>
        <a class="buy-btn" href="${escapeHtml(safeUrl(product.enlace))}" target="_blank" rel="noopener noreferrer sponsored">
          Ver oferta <span>↗</span>
        </a>
      </div>
    </div>
  `;

  const img = $(".product-image", article);
  img.addEventListener("error", () => {
    img.src = "https://placehold.co/900x700/111318/ffffff?text=Imagen+no+disponible";
  });

  return article;
}

function renderPublicProducts() {
  const container = $("#muro-container");
  if (!container) return;

  const search = ($("#search-input")?.value || "").trim().toLowerCase();
  const filtered = allProducts.filter(product => {
    return !search || product.titulo.toLowerCase().includes(search) || product.precio.toLowerCase().includes(search);
  });

  const count = $("#results-count");
  const total = $("#offer-count");
  if (total) total.textContent = allProducts.length;
  if (count) count.textContent = `${filtered.length} ${filtered.length === 1 ? "resultado" : "resultados"}`;

  container.innerHTML = "";
  if (!filtered.length) {
    $("#empty-state")?.classList.remove("hidden");
    return;
  }

  $("#empty-state")?.classList.add("hidden");
  filtered.forEach(product => container.appendChild(createProductCard(product)));
}

function subscribeToProducts({ publicMode = false } = {}) {
  if (unsubscribeProducts) unsubscribeProducts();

  const col = collection(db, "productos");
  unsubscribeProducts = onSnapshot(
    col,
    snapshot => {
      allProducts = snapshot.docs.map(normalizeProduct).sort((a, b) => b.fechaMillis - a.fechaMillis);
      $("#error-state")?.classList.add("hidden");

      if (publicMode) renderPublicProducts();
      if (!publicMode) renderAdminProducts();
    },
    error => {
      console.error(error);
      if (publicMode) {
        $("#muro-container").innerHTML = "";
        $("#error-state")?.classList.remove("hidden");
      } else {
        showToast("No se han podido cargar los productos.", "error");
      }
    }
  );
}

function setupPublicPage() {
  if (!$("#muro-container")) return;

  $("#search-input")?.addEventListener("input", renderPublicProducts);
  $("#refresh-btn")?.addEventListener("click", () => {
    $("#refresh-btn").classList.add("is-loading");
    setTimeout(() => $("#refresh-btn").classList.remove("is-loading"), 500);
    renderPublicProducts();
  });
  $("#retry-btn")?.addEventListener("click", () => subscribeToProducts({ publicMode: true }));

  subscribeToProducts({ publicMode: true });
}

function showToast(message, type = "success") {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.dataset.type = type;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 3200);
}

function formatDate(millis) {
  if (!millis) return "Sin fecha";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(millis));
}

function renderAdminProducts() {
  const container = $("#admin-products");
  if (!container) return;

  const search = ($("#admin-search")?.value || "").trim().toLowerCase();
  const filtered = allProducts.filter(product => !search || product.titulo.toLowerCase().includes(search) || product.precio.toLowerCase().includes(search));
  $("#admin-count").textContent = String(allProducts.length);

  container.innerHTML = "";
  $("#admin-empty")?.classList.toggle("hidden", filtered.length > 0);

  filtered.forEach(product => {
    const row = document.createElement("article");
    row.className = "admin-product-row";
    const thumb = product.imagen || "https://placehold.co/180x140/111318/ffffff?text=Sin+imagen";

    row.innerHTML = `
      <img src="${escapeHtml(thumb)}" alt="" class="admin-thumb" referrerpolicy="no-referrer">
      <div class="admin-product-info">
        <strong>${escapeHtml(product.titulo)}</strong>
        <span>${escapeHtml(product.precio)}</span>
        <small>Publicado: ${escapeHtml(formatDate(product.fechaMillis))}</small>
      </div>
      <div class="row-actions">
        <button class="row-btn edit" type="button" data-action="edit" data-id="${escapeHtml(product.id)}">Editar</button>
        <button class="row-btn delete" type="button" data-action="delete" data-id="${escapeHtml(product.id)}">Eliminar</button>
      </div>
    `;
    container.appendChild(row);
  });

  container.querySelectorAll(".admin-thumb").forEach(img => {
    img.addEventListener("error", () => img.src = "https://placehold.co/180x140/111318/ffffff?text=Sin+imagen");
  });
}

function resetProductForm() {
  $("#product-form")?.reset();
  $("#edit-id").value = "";
  $("#form-title").textContent = "Nuevo chollo";
  $("#submit-product").textContent = "Publicar oferta";
  $("#cancel-edit").classList.add("hidden");
  $("#upload-msg").textContent = "";
  updateImagePreview("");
}

function startEdit(product) {
  $("#edit-id").value = product.id;
  $("#prod-title").value = product.titulo;
  $("#prod-img").value = product.imagen;
  $("#prod-price").value = product.precio;
  $("#prod-link").value = product.enlace;
  $("#form-title").textContent = "Editar chollo";
  $("#submit-product").textContent = "Guardar cambios";
  $("#cancel-edit").classList.remove("hidden");
  updateImagePreview(product.imagen);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateImagePreview(url) {
  const box = $("#image-preview");
  if (!box) return;
  if (!url) {
    box.innerHTML = `<div class="image-preview-placeholder">La vista previa aparecerá aquí</div>`;
    return;
  }
  box.innerHTML = `<img src="${escapeHtml(url)}" alt="Vista previa">`;
  const img = $("img", box);
  img.addEventListener("error", () => {
    box.innerHTML = `<div class="image-preview-placeholder">No se puede cargar esta imagen</div>`;
  });
}

async function deleteProduct(product) {
  const ok = window.confirm(`¿Eliminar "${product.titulo}" del muro? Esta acción no se puede deshacer.`);
  if (!ok) return;

  try {
    await deleteDoc(doc(db, "productos", product.id));
    if ($("#edit-id").value === product.id) resetProductForm();
    showToast("Oferta eliminada.");
  } catch (error) {
    console.error(error);
    showToast("No se ha podido eliminar la oferta.", "error");
  }
}

function setupAdminPage() {
  if (!$("#login-section")) return;

  setupAuthUi();

  $("#admin-search")?.addEventListener("input", renderAdminProducts);
  $("#cancel-edit")?.addEventListener("click", resetProductForm);

  $("#toggle-password")?.addEventListener("click", () => {
    const input = $("#password");
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    $("#toggle-password").textContent = isPassword ? "Ocultar" : "Mostrar";
  });

  $("#prod-img")?.addEventListener("input", event => updateImagePreview(event.target.value));

  $("#admin-products")?.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const product = allProducts.find(p => p.id === button.dataset.id);
    if (!product) return;

    if (button.dataset.action === "edit") startEdit(product);
    if (button.dataset.action === "delete") deleteProduct(product);
  });

  $("#product-form")?.addEventListener("submit", handleProductSubmit);
}

function setupAuthUi() {
  const loginSection = $("#login-section");
  const adminSection = $("#admin-section");

  onAuthStateChanged(auth, user => {
    if (user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      loginSection.classList.add("hidden");
      adminSection.classList.remove("hidden");
      subscribeToProducts({ publicMode: false });
    } else {
      loginSection.classList.remove("hidden");
      adminSection.classList.add("hidden");
      if (user) signOut(auth);
    }
  });

  $("#login-form")?.addEventListener("submit", async event => {
    event.preventDefault();
    const email = $("#email").value.trim();
    const password = $("#password").value;
    const error = $("#login-error");
    const button = event.submitter;

    error.textContent = "";
    button.disabled = true;
    button.textContent = "Entrando...";

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error(err);
      error.textContent = "No se ha podido iniciar sesión. Revisa el correo y la contraseña.";
    } finally {
      button.disabled = false;
      button.textContent = "Entrar al panel";
    }
  });

  $("#btn-logout")?.addEventListener("click", async () => {
    await signOut(auth);
    resetProductForm();
  });
}

async function handleProductSubmit(event) {
  event.preventDefault();

  const id = $("#edit-id").value.trim();
  const titulo = $("#prod-title").value.trim();
  const imagen = $("#prod-img").value.trim();
  const precio = $("#prod-price").value.trim();
  const enlace = $("#prod-link").value.trim();
  const msg = $("#upload-msg");
  const button = $("#submit-product");

  if (!titulo || !imagen || !precio || !enlace) return;

  msg.textContent = "";
  button.disabled = true;
  button.textContent = id ? "Guardando..." : "Publicando...";

  try {
    if (id) {
      await updateDoc(doc(db, "productos", id), {
        titulo,
        imagen,
        precio,
        enlace,
        actualizadoEn: Timestamp.now()
      });
      showToast("Cambios guardados correctamente.");
    } else {
      await addDoc(collection(db, "productos"), {
        titulo,
        imagen,
        precio,
        enlace,
        fecha: Timestamp.now(),
        actualizadoEn: Timestamp.now()
      });
      showToast("Oferta publicada en el muro.");
    }

    resetProductForm();
  } catch (error) {
    console.error(error);
    msg.textContent = id
      ? "No se han podido guardar los cambios."
      : "No se ha podido publicar la oferta.";
    msg.className = "form-message error";
  } finally {
    button.disabled = false;
    if ($("#edit-id").value) button.textContent = "Guardar cambios";
    else button.textContent = "Publicar oferta";
  }
}

setupBaseUi();
setupPublicPage();
setupAdminPage();
