const conexion = require('../db/conexion');

// Guardar una devolución
async function guardarDevolucion(data, idUsuario) {
    const { idVenta, motivo, productos } = data;

    if (!idVenta || !productos || productos.length === 0) {
        return { success: false, message: 'ID de venta y productos son requeridos' };
    }

    const conn = await conexion.getConnection();
    try {
        await conn.beginTransaction();

        // Verificar que la venta existe
        const [venta] = await conn.query(
            'SELECT * FROM ventas WHERE idVenta = ?',
            [idVenta]
        );

        if (venta.length === 0) {
            throw new Error('Venta no encontrada');
        }

        // Insertar la devolución
        const [devolucion] = await conn.query(
            `INSERT INTO devoluciones (fechaDevolucion, idUsuario, idVenta, motivo)
             VALUES (NOW(), ?, ?, ?)`,
            [idUsuario, idVenta, motivo || '']
        );

        const idDevolucion = devolucion.insertId;

        // Insertar detalles y actualizar stock
        for (const p of productos) {
            const cantidadADevolver = Number.parseInt(p.cantidad, 10);
            if (!Number.isInteger(cantidadADevolver) || cantidadADevolver <= 0) {
                throw new Error(`Cantidad invalida para producto ID ${p.idProducto}`);
            }

            // Verificar que el producto fue parte de la venta
            const [detalleVenta] = await conn.query(
                `SELECT cantidadVendida, precioUnitario
                 FROM venta_detalle 
                 WHERE idVenta = ? AND idProducto = ?`,
                [idVenta, p.idProducto]
            );

            if (detalleVenta.length === 0) {
                throw new Error(`El producto ID ${p.idProducto} no pertenece a esta venta`);
            }

            const cantidadVendida = detalleVenta[0].cantidadVendida;
            const [[yaDevuelto]] = await conn.query(
                `SELECT COALESCE(SUM(dd.cantidad), 0) AS totalDevuelto
                 FROM devolucion_detalle dd
                 INNER JOIN devoluciones d ON dd.idDevolucion = d.idDevolucion
                 WHERE d.idVenta = ? AND dd.idProducto = ?`,
                [idVenta, p.idProducto]
            );
            const disponibleParaDevolver = cantidadVendida - Number(yaDevuelto.totalDevuelto || 0);

            if (cantidadADevolver > disponibleParaDevolver) {
                throw new Error(`Cantidad a devolver excede lo disponible para producto ID ${p.idProducto}`);
            }

            // Insertar detalle de devolución
            await conn.query(
                `INSERT INTO devolucion_detalle 
                 (idDevolucion, idProducto, cantidad, precioUnitario)
                 VALUES (?, ?, ?, ?)`,
                [idDevolucion, p.idProducto, cantidadADevolver, detalleVenta[0].precioUnitario]
            );

            // Actualizar el stock (sumar la cantidad devuelta)
            await conn.query(
                `UPDATE productos 
                 SET cantidad = cantidad + ?
                 WHERE idProducto = ?`,
                [cantidadADevolver, p.idProducto]
            );
        }

        await conn.commit();
        return { success: true, message: 'Devolución registrada correctamente' };

    } catch (error) {
        await conn.rollback();
        console.error('Error en devolución:', error);
        return { success: false, message: error.message || 'Error guardando devolución' };
    } finally {
        conn.release();
    }
}

// Obtener todas las devoluciones
async function obtenerDevoluciones() {
    try {
        const [rows] = await conexion.query(`
            SELECT 
                d.idDevolucion,
                d.fechaDevolucion,
                d.motivo,
                d.idVenta,
                CONCAT(u.nombres, ' ', u.apellidos) AS usuario
            FROM devoluciones d
            INNER JOIN usuarios u ON d.idUsuario = u.idUsuario
            ORDER BY d.fechaDevolucion DESC
        `);

        // Obtener los detalles de cada devolución
        for (let devolucion of rows) {
            const [detalles] = await conexion.query(`
                SELECT 
                    dd.idProducto,
                    p.nombreProducto,
                    dd.cantidad,
                    dd.precioUnitario
                FROM devolucion_detalle dd
                INNER JOIN productos p ON dd.idProducto = p.idProducto
                WHERE dd.idDevolucion = ?
            `, [devolucion.idDevolucion]);
            
            devolucion.detalles = detalles;
        }

        return { success: true, data: rows };
    } catch (error) {
        console.error('Error obteniendo devoluciones:', error);
        return { success: false, message: 'Error obteniendo devoluciones' };
    }
}

// Obtener productos de una venta específica (para saber qué se puede devolver)
async function obtenerProductosDeventa(idVenta) {
    try {
        const [rows] = await conexion.query(`
            SELECT 
                vd.idProducto,
                p.nombreProducto,
                vd.cantidadVendida,
                vd.precioUnitario,
                vd.subtotal
            FROM venta_detalle vd
            INNER JOIN productos p ON vd.idProducto = p.idProducto
            WHERE vd.idVenta = ?
        `, [idVenta]);
        return { success: true, data: rows };
    } catch (error) {
        console.error('Error obteniendo productos de venta:', error);
        return { success: false, message: 'Error obteniendo productos' };
    }
}

module.exports = {
    guardarDevolucion,
    obtenerDevoluciones,
    obtenerProductosDeventa
};
