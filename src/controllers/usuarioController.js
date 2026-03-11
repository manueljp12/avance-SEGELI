const conexion = require('../db/conexion');
const bcrypt = require('bcryptjs');

function esColumnaInexistente(error, columna) {
    return error && error.code === 'ER_BAD_FIELD_ERROR' && String(error.message || '').includes(columna);
}

function esErrorFk(error) {
    return error && (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451);
}

// Obtener todos los usuarios
async function obtenerUsuarios() {
    try {
        let rows;
        try {
            [rows] = await conexion.query(`
                SELECT 
                    u.idUsuario,
                    u.usuario,
                    u.cedula,
                    u.nombres,
                    u.apellidos,
                    u.correo,
                    u.telefono,
                    u.idRol,
                    r.nombreRol
                FROM usuarios u
                INNER JOIN roles r ON u.idRol = r.idRol
                ORDER BY u.nombres
            `);
        } catch (error) {
            if (!esColumnaInexistente(error, 'nombreRol')) throw error;
            [rows] = await conexion.query(`
                SELECT 
                    u.idUsuario,
                    u.usuario,
                    u.cedula,
                    u.nombres,
                    u.apellidos,
                    u.correo,
                    u.telefono,
                    u.idRol,
                    r.tipo AS nombreRol
                FROM usuarios u
                INNER JOIN roles r ON u.idRol = r.idRol
                ORDER BY u.nombres
            `);
        }
        return { success: true, data: rows };
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        return { success: false, message: 'Error obteniendo usuarios' };
    }
}

// Obtener un usuario por ID
async function obtenerUsuarioPorId(idUsuario) {
    try {
        const [rows] = await conexion.query(
            'SELECT * FROM usuarios WHERE idUsuario = ?',
            [idUsuario]
        );
        if (rows.length === 0) {
            return { success: false, message: 'Usuario no encontrado' };
        }
        return { success: true, data: rows[0] };
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        return { success: false, message: 'Error obteniendo usuario' };
    }
}

// Crear nuevo usuario
async function crearUsuario(data) {
    const { usuario, password, cedula, nombres, apellidos, correo, telefono, idRol } = data;
    
    if (!usuario || !password || !nombres || !apellidos || !idRol) {
        return { success: false, message: 'Los campos usuario, password, nombres, apellidos y rol son requeridos' };
    }
    
    try {
        // Verificar si el usuario ya existe
        const [existe] = await conexion.query(
            'SELECT idUsuario FROM usuarios WHERE usuario = ?',
            [usuario]
        );
        
        if (existe.length > 0) {
            return { success: false, message: 'El usuario ya existe' };
        }
        
        // Cifrar la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        const [result] = await conexion.query(
            `INSERT INTO usuarios (usuario, password, cedula, nombres, apellidos, correo, telefono, idRol)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [usuario, passwordHash, cedula || null, nombres, apellidos, correo || null, telefono || null, idRol]
        );
        
        return { success: true, message: 'Usuario creado correctamente', id: result.insertId };
    } catch (error) {
        console.error('Error creando usuario:', error);
        return { success: false, message: 'Error al crear usuario' };
    }
}

// Editar usuario
async function editarUsuario(data) {
    const { idUsuario, usuario, cedula, nombres, apellidos, correo, telefono, idRol, password } = data;
    
    if (!idUsuario || !usuario || !nombres || !apellidos || !idRol) {
        return { success: false, message: 'Todos los campos son requeridos' };
    }
    
    try {
        const [existe] = await conexion.query(
            'SELECT idUsuario FROM usuarios WHERE idUsuario = ?',
            [idUsuario]
        );
        
        if (existe.length === 0) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        const [usuarioDuplicado] = await conexion.query(
            'SELECT idUsuario FROM usuarios WHERE usuario = ? AND idUsuario <> ?',
            [usuario, idUsuario]
        );
        if (usuarioDuplicado.length > 0) {
            return { success: false, message: 'El nombre de usuario ya esta en uso' };
        }
        
        let query = `UPDATE usuarios SET usuario = ?, cedula = ?, nombres = ?, apellidos = ?, correo = ?, telefono = ?, idRol = ?`;
        let params = [usuario, cedula || null, nombres, apellidos, correo || null, telefono || null, idRol];
        
        // Si se proporciona una nueva contraseña, cifrarla y agregarla
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            query += ', password = ?';
            params.push(passwordHash);
        }
        
        query += ' WHERE idUsuario = ?';
        params.push(idUsuario);
        
        await conexion.query(query, params);
        
        return { success: true, message: 'Usuario actualizado correctamente' };
    } catch (error) {
        console.error('Error editando usuario:', error);
        return { success: false, message: 'Error al editar usuario' };
    }
}

// Eliminar usuario
async function eliminarUsuario(idUsuario, idSesionActual = null) {
    const id = Number.parseInt(idUsuario, 10);
    if (!id) {
        return { success: false, message: 'ID de usuario requerido' };
    }
    if (idSesionActual && Number(idSesionActual) === id) {
        return { success: false, message: 'No puede eliminar su propio usuario activo' };
    }
    
    try {
        const [existe] = await conexion.query(
            'SELECT idUsuario FROM usuarios WHERE idUsuario = ?',
            [id]
        );
        
        if (existe.length === 0) {
            return { success: false, message: 'Usuario no encontrado' };
        }
        
        await conexion.query('DELETE FROM usuarios WHERE idUsuario = ?', [id]);
        
        return { success: true, message: 'Usuario eliminado correctamente' };
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        if (esErrorFk(error)) {
            return { success: false, 
                message: 'No se puede eliminar: el usuario tiene movimientos asociados' };
        }
        return { success: false, message: 'Error al eliminar usuario' };
    }
}

// Obtener roles
async function obtenerRoles() {
    try {
        let rows;
        try {
            [rows] = await conexion.query('SELECT idRol, nombreRol FROM roles ORDER BY nombreRol');
        } catch (error) {
            if (!esColumnaInexistente(error, 'nombreRol')) throw error;
            [rows] = await conexion.query('SELECT idRol, tipo AS nombreRol FROM roles ORDER BY tipo');
        }
        return { success: true, data: rows };
    } catch (error) {
        console.error('Error obteniendo roles:', error);
        return { success: false, message: 'Error obteniendo roles' };
    }
}

module.exports = {
    obtenerUsuarios,
    obtenerUsuarioPorId,
    crearUsuario,
    editarUsuario,
    eliminarUsuario,
    obtenerRoles
};
