// Middleware de autenticación
// Almacena la sesión del usuario en memoria (en producción usar db o redis)

const sesiones = new Map();

function crearSesion(usuario, idUsuario, rol) {
    const sessionId = Math.random().toString(36).substring(2);
    sesiones.set(sessionId, {
        usuario,
        idUsuario,
        rol,
        fecha: new Date()
    });
    return sessionId;
}

function obtenerSesion(sessionId) {
    return sesiones.get(sessionId);
}

function eliminarSesion(sessionId) {
    return sesiones.delete(sessionId);
}

function verificarAutenticacion(sessionId) {
    if (!sessionId) {
        return { autenticado: false, mensaje: 'No hay sesión' };
    }
    
    const sesion = obtenerSesion(sessionId);
    if (!sesion) {
        return { autenticado: false, mensaje: 'Sesión inválida o expirada' };
    }
    
    return { autenticado: true, sesion };
}

function verificarRol(sessionId, rolesPermitidos) {
    const verificacion = verificarAutenticacion(sessionId);
    if (!verificacion.autenticado) {
        return { autorizado: false, mensaje: verificacion.mensaje };
    }
    
    if (!rolesPermitidos.includes(verificacion.sesion.rol)) {
        return { autorizado: false, mensaje: 'No tiene permisos para esta acción' };
    }
    
    return { autorizado: true, sesion: verificacion.sesion };
}

module.exports = {
    sesiones,
    crearSesion,
    obtenerSesion,
    eliminarSesion,
    verificarAutenticacion,
    verificarRol
};