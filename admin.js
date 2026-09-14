import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const adminGrid = document.getElementById('admin-productos');

document.getElementById('btn-login').addEventListener('click', async () => {
    try {
        await signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('password').value);
    } catch (e) { alert("Error de acceso: " + e.message); }
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        cargarAdminProductos();
    } else {
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    }
});

async function cargarAdminProductos() {
    const q = query(collection(db, "productos"), orderBy("fecha", "desc"));
    const snapshot = await getDocs(q);
    adminGrid.innerHTML = "";
    snapshot.forEach(item => {
        const p = item.data();
        adminGrid.innerHTML += `
            <div class="admin-item">
                <img src="${p.imagen}">
                <div style="flex: 1; margin: 0 15px; overflow:hidden;">
                    <strong style="font-size:0.9rem; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.titulo}</strong>
                    <span style="font-size:0.8rem; color:#64748b;">${p.precioActual}€ | ${p.categoria || 'General'}</span>
                </div>
                <div class="admin-actions">
                    <button class="btn-edit" onclick="window.editarChollo('${item.id}', '${encodeURIComponent(p.titulo)}', '${p.imagen}', '${p.categoria}', '${p.precioActual}', '${p.precioAnterior || ''}', '${encodeURIComponent(p.enlace)}')">Editar</button>
                    <button class="btn-delete" onclick="window.eliminarChollo('${item.id}')">Borrar</button>
                </div>
            </div>
        `;
    });
}

// Guardar / Actualizar
document.getElementById('btn-save').addEventListener('click', async () => {
    const id = document.getElementById('producto-id').value;
    const titulo = document.getElementById('titulo').value;
    const imagen = document.getElementById('imagen').value;
    const categoria = document.getElementById('categoria').value;
    const precioActual = parseFloat(document.getElementById('precio-actual').value);
    const precioAnterior = parseFloat(document.getElementById('precio-anterior').value) || 0;
    const enlace = document.getElementById('enlace').value;

    if (!titulo || !imagen || !precioActual || !enlace) {
        alert("Rellena los campos obligatorios");
        return;
    }

    try {
        if (id) {
            await updateDoc(doc(db, "productos", id), { titulo, imagen, categoria, precioActual, precioAnterior, enlace });
            alert("¡Chollo actualizado!");
            limpiarFormulario();
        } else {
            await addDoc(collection(db, "productos"), { titulo, imagen, categoria, precioActual, precioAnterior, enlace, fecha: serverTimestamp() });
            alert("¡Chollo publicado!");
            limpiarFormulario();
        }
        cargarAdminProductos();
    } catch (e) { alert("Error: " + e.message); }
});

window.editarChollo = (id, titulo, imagen, categoria, precioActual, precioAnterior, enlace) => {
    document.getElementById('producto-id').value = id;
    document.getElementById('titulo').value = decodeURIComponent(titulo);
    document.getElementById('imagen').value = imagen;
    document.getElementById('categoria').value = categoria;
    document.getElementById('precio-actual').value = precioActual;
    document.getElementById('precio-anterior').value = precioAnterior;
    document.getElementById('enlace').value = decodeURIComponent(enlace);
    document.getElementById('form-title').innerText = "✏️ Editar Chollo";
    document.getElementById('btn-save').innerText = "Actualizar Chollo";
    document.getElementById('btn-cancel').classList.remove('hidden');
};

document.getElementById('btn-cancel').addEventListener('click', limpiarFormulario);

function limpiarFormulario() {
    document.getElementById('producto-id').value = "";
    document.querySelectorAll('.card-admin input:not([type=hidden])').forEach(i => i.value = '');
    document.getElementById('form-title').innerText = "➕ Publicar Nuevo Chollo";
    document.getElementById('btn-save').innerText = "Publicar Chollo";
    document.getElementById('btn-cancel').classList.add('hidden');
}

window.eliminarChollo = async (id) => {
    if (confirm("¿Seguro que quieres eliminar este chollo?")) {
        await deleteDoc(doc(db, "productos", id));
        cargarAdminProductos();
    }
};
