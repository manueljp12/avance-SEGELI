let productosInventario = [];

function renderInventario(productos) {
    const tabla = document.getElementById('tablaInventario');
    if (!tabla) return;
    tabla.innerHTML = '';

    if (!productos || productos.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 6;
        td.textContent = 'No hay productos registrados';
        tr.appendChild(td);
        tabla.appendChild(tr);
        return;
    }

    productos.forEach((producto) => {
        const tr = document.createElement('tr');
        const cols = [
            producto.idProducto,
            producto.nombreProducto,
            producto.nombreCategoria,
            producto.cantidad,
            producto.cantidad <= 5 ? 'Bajo' : 'Normal'
        ];
        cols.forEach((v) => {
            const td = document.createElement('td');
            td.textContent = String(v);
            tr.appendChild(td);
        });

        const tdOpciones = document.createElement('td');

        const btnEditar = document.createElement('button');
        btnEditar.textContent = 'Editar';
        btnEditar.classList.add('btn-editar-inventario');

        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.classList.add('btn-eliminar-inventario');

        tdOpciones.appendChild(btnEditar);
        tdOpciones.appendChild(btnEliminar);

        tr.appendChild(tdOpciones);
        tabla.appendChild(tr);
    });
}

function normalizarTexto(valor) {
    return String(valor ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function filtrarInventario(texto) {
    const query = normalizarTexto(texto);
    if (!query) return productosInventario;

    return productosInventario.filter((producto) => {
        const estado = producto.cantidad <= 5 ? 'Bajo' : 'Normal';
        const campos = [
            producto.idProducto,
            producto.nombreProducto,
            producto.nombreCategoria,
            producto.cantidad,
            estado
        ];
        return campos.some((campo) => normalizarTexto(campo).includes(query));
    });
}

async function cargarInventario() {
    try {
        const response = await window.api.obtenerInventario();
        if (!response.success) throw new Error(response.message);

        productosInventario = response.data || [];
        renderInventario(productosInventario);
    } catch (error) {
        console.error('Error cargando inventario:', error);
    }
}

function initInventario() {
    const buscador = document.getElementById('buscadorInventario');
    if (buscador) {
        buscador.oninput = () => {
            const productosFiltrados = filtrarInventario(buscador.value);
            renderInventario(productosFiltrados);
        };
    }
    cargarInventario();
}

window.initInventario = initInventario;
