var productoSeleccionado = null;
var productosVenta = [];

function limpiarCamposProducto() {
    productoSeleccionado = null;
    document.getElementById('buscarProducto').value = '';
    document.getElementById('cantidad').value = '';
    document.getElementById('precio').value = '';
}

function renderTablaVentas() {
    const tabla = document.getElementById('tablaVentas');
    if (!tabla) return;
    tabla.innerHTML = '';

    let total = 0;
    productosVenta.forEach((p, index) => {
        total += p.subtotal;

        const tr = document.createElement('tr');
        const tdNombre = document.createElement('td');
        tdNombre.textContent = p.nombreProducto;
        const tdCantidad = document.createElement('td');
        tdCantidad.textContent = String(p.cantidad);
        const tdPrecio = document.createElement('td');
        tdPrecio.textContent = p.precio.toFixed(2);
        const tdSubtotal = document.createElement('td');
        tdSubtotal.textContent = p.subtotal.toFixed(2);
        const tdAccion = document.createElement('td');
        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.onclick = () => {
            productosVenta.splice(index, 1);
            renderTablaVentas();
        };
        tdAccion.appendChild(btnEliminar);

        tr.appendChild(tdNombre);
        tr.appendChild(tdCantidad);
        tr.appendChild(tdPrecio);
        tr.appendChild(tdSubtotal);
        tr.appendChild(tdAccion);
        tabla.appendChild(tr);
    });

    const totalEl = document.getElementById('totalVenta');
    if (totalEl) totalEl.textContent = total.toFixed(2);
}

function initVentas() {
    const btnAgregarVenta = document.getElementById('btnAgregarVenta');
    const btnGuardarVentas = document.getElementById('btnGuardarVentas');
    const inputBuscar = document.getElementById('buscarProducto');

    if (!btnAgregarVenta || !btnGuardarVentas || !inputBuscar) return;

    btnAgregarVenta.onclick = () => {
        const cantidad = Number.parseInt(document.getElementById('cantidad').value, 10);
        const precio = Number.parseFloat(document.getElementById('precio').value);

        if (!productoSeleccionado || !Number.isInteger(cantidad) || cantidad <= 0 || !Number.isFinite(precio) || precio <= 0) {
            alert('Datos invalidos. Seleccione un producto y cantidad valida.');
            return;
        }

        const subtotal = cantidad * precio;
        productosVenta.push({
            idProducto: productoSeleccionado.idProducto,
            nombreProducto: productoSeleccionado.nombreProducto,
            cantidad,
            precio,
            subtotal
        });

        renderTablaVentas();
        limpiarCamposProducto();
    };

    btnGuardarVentas.onclick = async () => {
        if (productosVenta.length === 0) {
            alert('No hay productos en la venta');
            return;
        }

        const observacion = document.getElementById('observacion').value;
        try {
            const response = await window.api.guardarVenta({ observacion, productos: productosVenta });
            if (!response.success) {
                alert(`Error: ${response.message}`);
                return;
            }

            alert('Venta realizada correctamente');
            productosVenta = [];
            renderTablaVentas();
            document.getElementById('observacion').value = '';
            document.getElementById('totalVenta').textContent = '0.00';
        } catch (error) {
            console.error(error);
            alert('Error al guardar la venta');
        }
    };

    inputBuscar.oninput = async () => {
        const texto = inputBuscar.value.trim();
        const lista = document.getElementById('listaProductos');
        if (texto.length < 2) {
            lista.innerHTML = '';
            return;
        }

        try {
            const response = await window.api.buscarProductosVentas(texto);
            if (!response.success) return;

            lista.innerHTML = '';
            (response.data || []).forEach((producto) => {
                const li = document.createElement('li');
                li.textContent = producto.nombreProducto;
                li.style.cursor = 'pointer';
                li.onclick = () => {
                    productoSeleccionado = producto;
                    document.getElementById('buscarProducto').value = producto.nombreProducto;
                    document.getElementById('precio').value = producto.precio;
                    lista.innerHTML = '';
                };
                lista.appendChild(li);
            });
        } catch (error) {
            console.error('Error buscando productos:', error);
        }
    };
}

window.initVentas = initVentas;
