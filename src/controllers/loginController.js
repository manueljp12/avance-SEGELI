const conexion = require('../db/conexion');
const bcrypt = require('bcryptjs');

async function login(usuario, password) {
  try {
    const [rows] = await conexion.query(
      'SELECT * FROM usuarios WHERE usuario = ?',
      [usuario]
    );

    if (rows.length === 0) {
      return { success: false, message: 'Usuario no encontrado' };
    }

    const user = rows[0];

    let match = false;
    if (typeof user.password === 'string' && user.password.startsWith('$2')) {
      match = await bcrypt.compare(password, user.password);
    } else {
      // Compatibilidad con datos legacy en texto plano.
      match = password === user.password;
      if (match) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        await conexion.query('UPDATE usuarios SET password = ? WHERE idUsuario = ?', [hash, user.idUsuario]);
      }
    }

    if (!match) {
      return { success: false, message: 'Contraseña incorrecta' };
    }

    return {
      success: true,
      nombre: user.nombres,
      apellido: user.apellidos,
      idUsuario: user.idUsuario,
      rol: user.idRol,
      usuario: user.usuario
    };

  } catch (error) {
    console.error('Error en login:', error);
    return { success: false, message: 'Error interno del servidor' };
  }
}

module.exports = { login };


