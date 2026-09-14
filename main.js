import { db } from "./firebase-config.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const grid = document.getElementById('grid-productos');

async function cargarProductos() {
    const q = query(collection(db, "productos"), orderBy("fecha", "desc"));
    const querySnapshot = await getDocs(q);
    grid.innerHTML = "";

    querySnapshot.forEach((doc) => {
        const p = doc.data();
        const descuento = Math.round(((p.precioAnterior - p.precioActual) / p.precioAnterior) * 100);
        
        grid.innerHTML += `
            <div class="card">
                <img src="${p.imagen}" alt="${p.titulo}">
                <h3>${p.titulo}</h3>
                <div class="price-box">
                    <span class="precio-actual">${p.precioActual}€</span>
                    <span class="precio-anterior">${p.precioAnterior}€</span>
                    <span class="descuento">-${descuento}%</span>
                </div>
                <a href="${p.enlace}" target="_blank" class="btn-primary">Ver en Amazon</a>
            </div>
        `;
    });
}

cargarProductos();
