const conexion = require('../db/conexion');

async function insertarDetalleRecepcion(conn, idRecepcion, productoId, cantidad, precioFactura) {
  try {
    await conn.query(
      `INSERT INTO recepcion_detalle
       (idRecepcion, idProducto, cantidad, precioFactura, precioDetal)
       VALUES (?, ?, ?, ?, ?)`,
      [idRecepcion, productoId, cantidad, precioFactura, precioFactura]
    );
    return;
  } catch (error) {
    if (error.code !== 'ER_BAD_FIELD_ERROR') throw error;
  }

  try {
    await conn.query(
      `INSERT INTO recepcion_detalle
       (idRecepcion, idProducto, cantidad, precioFactura)
       VALUES (?, ?, ?, ?)`,
      [idRecepcion, productoId, cantidad, precioFactura]
    );
    return;
  } catch (error) {
    if (error.code !== 'ER_BAD_FIELD_ERROR') throw error;
  }

  await conn.query(
    `INSERT INTO recepcion_detalle
     (idRecepcion, idProducto, cantidad)
     VALUES (?, ?, ?)`,
    [idRecepcion, productoId, cantidad]
  );
}

async function guardarRecepcion(data, idUsuario) {
  const { observacion, productos } = data;
  if (!Array.isArray(productos) || productos.length === 0) {
    return { success: false, message: 'Debe agregar al menos un producto' };
  }

  const conn = await conexion.getConnection();

  try {
    await conn.beginTransaction();

    // 1️⃣ insertar recepción
    const [recepcion] = await conn.query(
      `INSERT INTO recepcion (fechaRecepcion, idUsuario, observacion)
       VALUES (NOW(), ?, ?)`,
      [idUsuario, observacion]
    );

    const idRecepcion = recepcion.insertId;

    // 2️⃣ insertar detalle + actualizar stock
    for (const p of productos) {
      const cantidad = Number.parseInt(p.cantidad, 10);
      const precioFactura = Number(p.precioFactura);
      if (!Number.isInteger(cantidad) || cantidad <= 0 || !Number.isFinite(precioFactura) || precioFactura <= 0) {
        throw new Error(`Datos invalidos para producto ID ${p.idProducto}`);
      }

      await insertarDetalleRecepcion(conn, idRecepcion, p.idProducto, cantidad, precioFactura);

      await conn.query(
        `UPDATE productos
         SET cantidad = cantidad + ?,
             precioFactura = ?
         WHERE idProducto = ?`,
        [cantidad, precioFactura, p.idProducto]
      );
    }

    await conn.commit();

    return { success: true };

  } catch (error) {
    await conn.rollback();
    console.error('Error recepción:', error);
    return { success: false, message: 'Error guardando recepción' };

  } finally {
    conn.release();
  }
}

async function buscarProductos(texto) {
  try {
    const [rows] = await conexion.query(
      `
      SELECT idProducto, nombreProducto
      FROM productos
      WHERE nombreProducto LIKE ?
      LIMIT 10
      `,
      [`%${texto}%`]
    );

    return { success: true, data: rows };
  } catch (error) {
    console.error('Error buscando productos:', error);
    return { success: false, message: 'Error buscando productos' };
  }
}


module.exports = { guardarRecepcion, buscarProductos };
