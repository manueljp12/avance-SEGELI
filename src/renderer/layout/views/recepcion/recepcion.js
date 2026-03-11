var productoSeleccionado = null;
var productosRecepcion = [];

function limpiarCampos() {
    productoSeleccionado = null;
    document.getElementById('buscarProducto').value = '';
    document.getElementById('cantidad').value = '';
    document.getElementById('precioFactura').value = '';
    document.getElementById('observacion').value = '';
}

function renderTablaRecepcion() {
    const tabla = document.getElementById('tablaRecepcion');
    if (!tabla) return;
    tabla.innerHTML = '';

    productosRecepcion.forEach((p, index) => {
        const tr = document.createElement('tr');
        const tdNombre = document.createElement('td');
        tdNombre.textContent = p.nombreProducto;
        const tdCantidad = document.createElement('td');
        tdCantidad.textContent = String(p.cantidad);
        const tdPrecio = document.createElement('td');
        tdPrecio.textContent = p.precioFactura.toFixed(2);
        const tdAccion = document.createElement('td');
        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.onclick = () => {
            productosRecepcion.splice(index, 1);
            renderTablaRecepcion();
        };
        tdAccion.appendChild(btnEliminar);

        tr.appendChild(tdNombre);
        tr.appendChild(tdCantidad);
        tr.appendChild(tdPrecio);
        tr.appendChild(tdAccion);
        tabla.appendChild(tr);
    });
}

function initRecepcion() {
    const btnAgregar = document.getElementById('btnAgregar');
    const btnGuardar = document.getElementById('btnGuardar');
    const inputBuscar = document.getElementById('buscarProducto');
    if (!btnAgregar || !btnGuardar || !inputBuscar) return;

    btnAgregar.onclick = () => {
        const cantidad = Number.parseInt(document.getElementById('cantidad').value, 10);
        const precioFactura = Number.parseFloat(document.getElementById('precioFactura').value);
        if (!productoSeleccionado || !Number.isInteger(cantidad) || cantidad <= 0 || !Number.isFinite(precioFactura) || precioFactura <= 0) {
            alert('Datos invalidos. Seleccione un producto y capture cantidad/precio validos.');
            return;
        }

        productosRecepcion.push({
            idProducto: productoSeleccionado.idProducto,
            nombreProducto: productoSeleccionado.nombreProducto,
            cantidad,
            precioFactura
        });
        renderTablaRecepcion();
        limpiarCampos();
    };


    btnGuardar.onclick = async () => {
        if (productosRecepcion.length === 0) {
            alert('Agrega al menos un producto');
            return;
        }
        const observacion = document.getElementById('observacion').value;
        try {
            const response = await window.api.guardarRecepcion({ observacion, productos: productosRecepcion });
            if (!response.success) {
                alert(response.message || 'Error guardando recepcion');
                return;
            }

            alert('Recepcion guardada correctamente');
            productosRecepcion = [];
            renderTablaRecepcion();
            limpiarCampos();
        } catch (error) {
            console.error('Error:', error);
            alert('Error al guardar recepcion');
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
            const response = await window.api.buscarProductos(texto);
            if (!response.success) return;

            lista.innerHTML = '';
            (response.data || []).forEach((producto) => {
                const li = document.createElement('li');
                li.textContent = producto.nombreProducto;
                li.style.cursor = 'pointer';
                li.onclick = () => {
                    productoSeleccionado = producto;
                    document.getElementById('buscarProducto').value = producto.nombreProducto;
                    lista.innerHTML = '';
                };
                lista.appendChild(li);
            });
        } catch (error) {
            console.error('Error buscando productos:', error);
        }
    };
}

window.initRecepcion = initRecepcion;
