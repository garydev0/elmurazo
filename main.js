import { db } from "./firebase-config.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

let productosGlobales = [];
let categoriaActual = "todos";
const grid = document.getElementById('grid-productos');
const buscador = document.getElementById('buscador');

async function cargarProductos() {
    const q = query(collection(db, "productos"), orderBy("fecha", "desc"));
    const querySnapshot = await getDocs(q);
    productosGlobales = [];
    querySnapshot.forEach((doc) => {
        productosGlobales.push({ id: doc.id, ...doc.data() });
    });
    renderProductos(productosGlobales);
}

function renderProductos(productos) {
    grid.innerHTML = "";
    if (productos.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#64748b; padding:40px;">No se encontraron chollos.</p>`;
        return;
    }

    productos.forEach(p => {
        const descuento = p.precioAnterior ? Math.round(((p.precioAnterior - p.precioActual) / p.precioAnterior) * 100) : 0;
        
        grid.innerHTML += `
            <div class="card">
                <span class="badge-cat">${p.categoria || 'General'}</span>
                <img src="${p.imagen}" alt="${p.titulo}">
                <h3>${p.titulo}</h3>
                <div class="price-box">
                    <span class="precio-actual">${p.precioActual}€</span>
                    ${p.precioAnterior ? `<span class="precio-anterior">${p.precioAnterior}€</span>` : ''}
                    ${descuento > 0 ? `<span class="descuento">-${descuento}%</span>` : ''}
                </div>
                <a href="${p.enlace}" target="_blank" class="btn-primary">Ver en Amazon</a>
            </div>
        `;
    });
}

// Filtrar por categoría
document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        categoriaActual = e.target.getAttribute('data-cat');
        filtrarYBuscar();
    });
});

// Buscador
buscador.addEventListener('input', filtrarYBuscar);

function filtrarYBuscar() {
    const texto = buscador.value.toLowerCase();
    const filtrados = productosGlobales.filter(p => {
        const coincideCat = categoriaActual === "todos" || p.categoria === categoriaActual;
        const coincideTexto = p.titulo.toLowerCase().includes(texto);
        return coincideCat && coincideTexto;
    });
    renderProductos(filtrados);
}

cargarProductos();
