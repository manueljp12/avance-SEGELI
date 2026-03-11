var devolucionesData = [];
var productosVenta = [];

function setMensajeTabla(tbody, mensaje, colSpan) {
    tbody.innerHTML = '';
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = colSpan;
    td.textContent = mensaje;
    tr.appendChild(td);
    tbody.appendChild(tr);
}

function renderizarTabla(devoluciones) {
    const tbody = document.querySelector('#tablaDevoluciones tbody');
    if (!tbody) return;

    if (!devoluciones || devoluciones.length === 0) {
        setMensajeTabla(tbody, 'No hay devoluciones registradas', 6);
        return;
    }

    tbody.innerHTML = '';
    devoluciones.forEach((d) => {
        const tr = document.createElement('tr');

        const celdas = [
            d.idDevolucion,
            new Date(d.fechaDevolucion).toLocaleString(),
            d.idVenta,
            d.usuario,
            d.motivo || '-'
        ];

        celdas.forEach((val) => {
            const td = document.createElement('td');
            td.textContent = String(val ?? '');
            tr.appendChild(td);
        });

        const tdAccion = document.createElement('td');
        const btnVer = document.createElement('button');
        btnVer.className = 'btn-icon';
        btnVer.textContent = 'Ver';
        btnVer.onclick = () => window.verDetallesDevolucion(d.idDevolucion);
        tdAccion.appendChild(btnVer);
        tr.appendChild(tdAccion);

        tbody.appendChild(tr);
    });
}

function renderizarProductosVenta(productos) {
    const tbody = document.querySelector('#tablaProductosVenta tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    productos.forEach((p, index) => {
        const tr = document.createElement('tr');

        const tdNombre = document.createElement('td');
        tdNombre.textContent = p.nombreProducto;
        tr.appendChild(tdNombre);

        const tdCantidad = document.createElement('td');
        tdCantidad.textContent = String(p.cantidadVendida);
        tr.appendChild(tdCantidad);

        const tdPrecio = document.createElement('td');
        tdPrecio.textContent = `$${Number(p.precioUnitario).toFixed(2)}`;
        tr.appendChild(tdPrecio);

        const tdInput = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'number';
        input.id = `devolver_${index}`;
        input.min = '0';
        input.max = String(p.cantidadVendida);
        input.value = '0';
        input.style.width = '60px';
        const span = document.createElement('span');
        span.textContent = ` / ${p.cantidadVendida}`;
        tdInput.appendChild(input);
        tdInput.appendChild(span);
        tr.appendChild(tdInput);

        tbody.appendChild(tr);
    });
}

async function cargarDevoluciones() {
    try {
        const response = await window.api.devolucionObtener();
        if (!response.success) throw new Error(response.message);

        devolucionesData = response.data || [];
        renderizarTabla(devolucionesData);
    } catch (error) {
        console.error('Error cargando devoluciones:', error);
        const tbody = document.querySelector('#tablaDevoluciones tbody');
        if (tbody) setMensajeTabla(tbody, 'Error al cargar devoluciones', 6);
    }
}

async function buscarVenta() {
    const idVenta = Number.parseInt(document.getElementById('idVenta').value, 10);
    if (!idVenta) {
        alert('Ingrese el ID de la venta');
        return;
    }

    try {
        const response = await window.api.devolucionProductosVenta(idVenta);
        if (!response.success) {
            alert(response.message);
            return;
        }

        productosVenta = response.data || [];
        if (productosVenta.length === 0) {
            alert('No se encontraron productos para esta venta');
            return;
        }

        renderizarProductosVenta(productosVenta);
        document.getElementById('infoVenta').style.display = 'block';
    } catch (error) {
        console.error('Error buscando venta:', error);
        alert('Error al buscar la venta');
    }
}

async function guardarDevolucion() {
    const idVenta = Number.parseInt(document.getElementById('idVenta').value, 10);
    const motivo = document.getElementById('motivo').value.trim();

    const productos = [];
    productosVenta.forEach((p, index) => {
        const cantidad = Number.parseInt(document.getElementById(`devolver_${index}`)?.value || '0', 10);
        if (cantidad > 0) productos.push({ idProducto: p.idProducto, cantidad });
    });

    if (productos.length === 0) {
        alert('Seleccione al menos un producto para devolver');
        return;
    }

    try {
        const response = await window.api.devolucionGuardar({ idVenta, motivo, productos });
        if (!response.success) {
            alert(`Error: ${response.message}`);
            return;
        }
        alert('Devolucion registrada correctamente');
        document.getElementById('modalDevolucion').style.display = 'none';
        await cargarDevoluciones();
    } catch (error) {
        console.error('Error guardando devolucion:', error);
        alert('Error al registrar devolucion');
    }
}

window.verDetallesDevolucion = function(idDevolucion) {
    const devolucion = devolucionesData.find((d) => d.idDevolucion === idDevolucion);
    if (!devolucion) return;

    const content = document.getElementById('detallesContent');
    content.innerHTML = '';

    const campos = [
        ['ID', devolucion.idDevolucion],
        ['Fecha', new Date(devolucion.fechaDevolucion).toLocaleString()],
        ['Venta ID', devolucion.idVenta],
        ['Usuario', devolucion.usuario],
        ['Motivo', devolucion.motivo || 'Sin motivo']
    ];

    campos.forEach(([label, value]) => {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = `${label}: `;
        p.appendChild(strong);
        p.appendChild(document.createTextNode(String(value)));
        content.appendChild(p);
    });

    const h4 = document.createElement('h4');
    h4.textContent = 'Productos Devueltos';
    content.appendChild(h4);

    const table = document.createElement('table');
    table.style.width = '100%';
    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');
    ['Producto', 'Cantidad', 'Precio'].forEach((h) => {
        const th = document.createElement('th');
        th.textContent = h;
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    (devolucion.detalles || []).forEach((d) => {
        const tr = document.createElement('tr');
        const tdProducto = document.createElement('td');
        tdProducto.textContent = d.nombreProducto;
        const tdCantidad = document.createElement('td');
        tdCantidad.textContent = String(d.cantidad);
        const tdPrecio = document.createElement('td');
        tdPrecio.textContent = `$${Number(d.precioUnitario).toFixed(2)}`;
        tr.appendChild(tdProducto);
        tr.appendChild(tdCantidad);
        tr.appendChild(tdPrecio);
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    content.appendChild(table);

    document.getElementById('modalDetalles').style.display = 'block';
};

function initDevoluciones() {
    const btnNueva = document.getElementById('btnNuevaDevolucion');
    if (btnNueva) {
        btnNueva.onclick = () => {
            document.getElementById('modalDevolucion').style.display = 'block';
            document.getElementById('formDevolucion').reset();
            document.getElementById('infoVenta').style.display = 'none';
        };
    }

    const modals = document.querySelectorAll('.modal .close');
    modals.forEach((btn) => {
        btn.onclick = () => btn.closest('.modal').style.display = 'none';
    });

    const btnCancelar = document.getElementById('btnCancelarDevolucion');
    if (btnCancelar) btnCancelar.onclick = () => { document.getElementById('modalDevolucion').style.display = 'none'; };

    const btnBuscar = document.getElementById('btnBuscarVenta');
    if (btnBuscar) btnBuscar.onclick = buscarVenta;

    const form = document.getElementById('formDevolucion');
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            guardarDevolucion();
        };
    }

    window.onclick = (e) => {
        if (e.target.classList.contains('modal')) e.target.style.display = 'none';
    };

    cargarDevoluciones();
}

window.initDevoluciones = initDevoluciones;
