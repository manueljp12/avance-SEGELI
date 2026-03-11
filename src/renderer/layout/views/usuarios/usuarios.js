var usuariosData = [];

function setFilaMensaje(tbody, mensaje) {
    tbody.innerHTML = '';
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 9;
    td.textContent = mensaje;
    tr.appendChild(td);
    tbody.appendChild(tr);
}

function renderizarTabla(usuarios) {
    const tbody = document.querySelector('#tablaUsuarios tbody');
    if (!tbody) return;

    if (!usuarios || usuarios.length === 0) {
        setFilaMensaje(tbody, 'No hay usuarios registrados');
        return;
    }

    tbody.innerHTML = '';
    usuarios.forEach((u) => {
        const tr = document.createElement('tr');

        const columnas = [
            u.idUsuario,
            u.usuario,
            u.cedula || '-',
            u.nombres,
            u.apellidos,
            u.correo || '-',
            u.telefono || '-',
            u.nombreRol
        ];

        columnas.forEach((valor) => {
            const td = document.createElement('td');
            td.textContent = String(valor ?? '');
            tr.appendChild(td);
        });

        const tdAcciones = document.createElement('td');
        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn-icon';
        btnEditar.textContent = 'Editar';
        btnEditar.onclick = () => window.editarUsuario(u.idUsuario);

        const btnEliminar = document.createElement('button');
        btnEliminar.className = 'btn-icon';
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.onclick = () => window.eliminarUsuario(u.idUsuario);

        tdAcciones.appendChild(btnEditar);
        tdAcciones.appendChild(btnEliminar);
        tr.appendChild(tdAcciones);
        tbody.appendChild(tr);
    });
}

async function cargarUsuarios() {
    try {
        const response = await window.api.usuariosObtener();
        if (!response.success) throw new Error(response.message);

        usuariosData = response.data || [];
        renderizarTabla(usuariosData);
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        const tbody = document.querySelector('#tablaUsuarios tbody');
        if (tbody) setFilaMensaje(tbody, 'Error al cargar usuarios');
    }
}

async function cargarRoles() {
    try {
        const response = await window.api.usuariosRoles();
        if (!response.success) throw new Error(response.message);

        const select = document.getElementById('idRol');
        if (!select) return;

        select.innerHTML = '';
        const base = document.createElement('option');
        base.value = '';
        base.textContent = 'Seleccionar rol';
        select.appendChild(base);

        (response.data || []).forEach((rol) => {
            const option = document.createElement('option');
            option.value = rol.idRol;
            option.textContent = rol.nombreRol;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando roles:', error);
    }
}

function abrirModal(usuario = null) {
    const modal = document.getElementById('modalUsuario');
    const titulo = document.getElementById('modalTitulo');
    const form = document.getElementById('formUsuario');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('idUsuario').value = '';

    if (usuario) {
        titulo.textContent = 'Editar Usuario';
        document.getElementById('idUsuario').value = usuario.idUsuario;
        document.getElementById('usuario').value = usuario.usuario;
        document.getElementById('cedula').value = usuario.cedula || '';
        document.getElementById('nombres').value = usuario.nombres;
        document.getElementById('apellidos').value = usuario.apellidos;
        document.getElementById('correo').value = usuario.correo || '';
        document.getElementById('telefono').value = usuario.telefono || '';
        document.getElementById('idRol').value = usuario.idRol;
        document.getElementById('password').required = false;
    } else {
        titulo.textContent = 'Nuevo Usuario';
        document.getElementById('password').required = true;
    }

    modal.style.display = 'block';
}

function cerrarModal() {
    const modal = document.getElementById('modalUsuario');
    if (modal) modal.style.display = 'none';
}

window.editarUsuario = function(idUsuario) {
    const usuario = usuariosData.find((u) => u.idUsuario === idUsuario);
    if (usuario) abrirModal(usuario);
};

window.eliminarUsuario = async function(idUsuario) {
    if (!confirm('Esta seguro de eliminar este usuario?')) return;
    try {
        const response = await window.api.usuariosEliminar(idUsuario);
        if (!response.success) {
            alert(`Error: ${response.message}`);
            return;
        }
        alert('Usuario eliminado correctamente');
        await cargarUsuarios();
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        alert('Error al eliminar usuario');
    }
};

async function guardarUsuario() {
    const idUsuario = document.getElementById('idUsuario').value;
    const data = {
        usuario: document.getElementById('usuario').value.trim(),
        password: document.getElementById('password').value,
        cedula: document.getElementById('cedula').value.trim(),
        nombres: document.getElementById('nombres').value.trim(),
        apellidos: document.getElementById('apellidos').value.trim(),
        correo: document.getElementById('correo').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        idRol: Number.parseInt(document.getElementById('idRol').value, 10)
    };

    if (idUsuario && !data.password) delete data.password;

    try {
        let response;
        if (idUsuario) {
            data.idUsuario = Number.parseInt(idUsuario, 10);
            response = await window.api.usuariosEditar(data);
        } else {
            response = await window.api.usuariosCrear(data);
        }

        if (!response.success) {
            alert(`Error: ${response.message}`);
            return;
        }

        alert(idUsuario ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
        cerrarModal();
        await cargarUsuarios();
    } catch (error) {
        console.error('Error guardando usuario:', error);
        alert('Error al guardar usuario');
    }
}

function initUsuarios() {
    const btnNuevo = document.getElementById('btnNuevoUsuario');
    if (btnNuevo) btnNuevo.onclick = () => abrirModal();

    const closeBtn = document.querySelector('#modalUsuario .close');
    if (closeBtn) closeBtn.onclick = cerrarModal;

    const btnCancelar = document.getElementById('btnCancelar');
    if (btnCancelar) btnCancelar.onclick = cerrarModal;

    const formUsuario = document.getElementById('formUsuario');
    if (formUsuario) {
        formUsuario.onsubmit = (e) => {
            e.preventDefault();
            guardarUsuario();
        };
    }

    window.onclick = (e) => {
        const modal = document.getElementById('modalUsuario');
        if (e.target === modal) cerrarModal();
    };

    cargarUsuarios();
    cargarRoles();
}

window.initUsuarios = initUsuarios;
