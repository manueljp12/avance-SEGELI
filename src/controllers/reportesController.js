const conexion = require('../db/conexion');

// ===============================
// 📦 INVENTARIO
// ===============================
async function inventarioStockActual() {
    const [rows] = await conexion.query(`
        SELECT 
            p.nombreProducto,
            c.nombreCategoria,
            p.cantidad,
            p.precioDetal
        FROM productos p
        INNER JOIN categoria c ON p.idCategoria = c.idCategoria
        ORDER BY p.nombreProducto
    `);
    return { success: true, data: rows };
}

async function inventarioBajoStock(stockMinimo = 0) {
    const minimo = Number.isFinite(Number(stockMinimo)) ? Number(stockMinimo) : 0;
    const [rows] = await conexion.query(`
        SELECT 
            nombreProducto,
            cantidad,
            stockMinimo
        FROM productos
        WHERE cantidad <= GREATEST(stockMinimo, ?)
    `, [minimo]);
    return { success: true, data: rows };
}

async function inventarioPorCategoria() {
    const [rows] = await conexion.query(`
        SELECT 
            c.nombreCategoria,
            SUM(p.cantidad) AS totalProductos,
            SUM(p.cantidad * p.precioDetal) AS valorInventario
        FROM productos p
        INNER JOIN categoria c ON p.idCategoria = c.idCategoria
        GROUP BY c.idCategoria
    `);
    return { success: true, data: rows };
}

// ===============================
// 📥 RECEPCIONES
// ===============================
async function recepcionesPorRango(inicio, fin, idCategoria = null, idUsuario = null) {
    let query = `
        SELECT 
            r.fechaRecepcion,
            CONCAT(u.nombres, ' ', u.apellidos) AS usuario,
            GROUP_CONCAT(DISTINCT c.nombreCategoria ORDER BY c.nombreCategoria SEPARATOR ', ') AS categorias,
            SUM(rd.cantidad) AS totalProductos
        FROM recepcion r
        INNER JOIN usuarios u ON r.idUsuario = u.idUsuario
        INNER JOIN recepcion_detalle rd ON r.idRecepcion = rd.idRecepcion
        INNER JOIN productos p ON rd.idProducto = p.idProducto
        INNER JOIN categoria c ON p.idCategoria = c.idCategoria
        WHERE DATE(r.fechaRecepcion) BETWEEN ? AND ?
    `;
    const params = [inicio, fin];

    if (idCategoria) {
        query += " AND c.idCategoria = ?";
        params.push(idCategoria);
    }

    if (idUsuario) {
        query += " AND u.idUsuario = ?";
        params.push(idUsuario);
    }

    query += " GROUP BY r.idRecepcion, r.fechaRecepcion, u.idUsuario";

    const [rows] = await conexion.query(query, params);
    return { success: true, data: rows };
}


async function recepcionesPorUsuario() {
    const [rows] = await conexion.query(`
        SELECT 
            CONCAT(u.nombres, ' ', u.apellidos) AS usuario,
            COUNT(r.idRecepcion) AS totalRecepciones,
            SUM(rd.cantidad) AS totalProductos
        FROM recepcion r
        INNER JOIN usuarios u ON r.idUsuario = u.idUsuario
        INNER JOIN recepcion_detalle rd ON r.idRecepcion = rd.idRecepcion
        GROUP BY u.idUsuario
    `);
    return { success: true, data: rows };
}

// ===============================
// 📤 VENTAS
// ===============================
async function ventasPorRango(inicio, fin) {
    const [rows] = await conexion.query(`
        SELECT 
            v.fechaVenta,
            CONCAT(u.nombres, ' ', u.apellidos) AS usuario,
            v.total
        FROM ventas v
        INNER JOIN usuarios u ON v.idUsuario = u.idUsuario
        WHERE DATE(v.fechaVenta) BETWEEN ? AND ?
        ORDER BY v.fechaVenta
    `, [inicio, fin]);
    return { success: true, data: rows };
}

async function ventasPorUsuario() {
    const [rows] = await conexion.query(`
        SELECT 
            CONCAT(u.nombres, ' ', u.apellidos) AS usuario,
            COUNT(v.idVenta) AS totalVentas,
            SUM(v.total) AS totalVendido
        FROM ventas v
        INNER JOIN usuarios u ON v.idUsuario = u.idUsuario
        GROUP BY u.idUsuario
    `);
    return { success: true, data: rows };
}

async function ventasPorProducto() {
    const [rows] = await conexion.query(`
        SELECT 
            p.nombreProducto,
            SUM(vd.cantidadVendida) AS cantidadVendida,
            SUM(vd.cantidadVendida * vd.precioUnitario) AS totalGenerado
        FROM venta_detalle vd
        INNER JOIN productos p ON vd.idProducto = p.idProducto
        GROUP BY p.idProducto
    `);
    return { success: true, data: rows };
}

// ===============================
// 👤 USUARIOS
// ===============================
async function actividadPorUsuario() {
    const [rows] = await conexion.query(`
        SELECT 
            CONCAT(u.nombres, ' ', u.apellidos) AS usuario,
            COUNT(DISTINCT r.idRecepcion) AS recepciones,
            COUNT(DISTINCT v.idVenta) AS ventas
        FROM usuarios u
        LEFT JOIN recepcion r ON u.idUsuario = r.idUsuario
        LEFT JOIN ventas v ON u.idUsuario = v.idUsuario
        GROUP BY u.idUsuario
    `);
    return { success: true, data: rows };
}

// ===============================
// CENTRAL
// ===============================
async function generarReporte({ categoria, tipo, filtros }) {
    try {
        const filtrosNormalizados = filtros || {};
        switch (categoria) {
            case 'inventario':
                if (tipo === 'stock-actual') return await inventarioStockActual();
                if (tipo === 'bajo-stock') return await inventarioBajoStock(filtrosNormalizados.stockMinimo);
                if (tipo === 'por-categoria') return await inventarioPorCategoria();
                break;

            case 'recepcion':
                if (tipo === 'por-fecha') { 
                    return await recepcionesPorRango( 
                        filtrosNormalizados.fechaInicio, 
                        filtrosNormalizados.fechaFin, 
                        filtrosNormalizados.categoria || null, 
                        filtrosNormalizados.usuario || null ); }
                if (tipo === 'por-usuario') return await recepcionesPorUsuario();
                break;

            case 'ventas':
                if (tipo === 'por-fecha') return await ventasPorRango(filtrosNormalizados.fechaInicio, filtrosNormalizados.fechaFin);
                if (tipo === 'por-usuario') return await ventasPorUsuario();
                if (tipo === 'por-producto') return await ventasPorProducto();
                break;

            case 'usuarios':
                if (tipo === 'actividad') return await actividadPorUsuario();
                break;
        }

        return { success: false, message: 'Reporte no implementado' };
    } catch (error) {
        console.error('Error generando reporte:', error);
        return { success: false, message: 'Error interno del reporte' };
    }
}

async function obtenerUsuarios() { 
    const [rows] = await conexion.query(`
        SELECT idUsuario, CONCAT(nombres, ' ', apellidos) AS nombre 
        FROM usuarios ORDER BY nombres 
        `);
         return { success: true, data: rows };
} 

async function obtenerCategorias() { 
    const [rows] = await conexion.query(` 
        SELECT idCategoria, nombreCategoria FROM 
        categoria ORDER BY nombreCategoria 
        `); 
        return { success: true, data: rows };
}

module.exports = { generarReporte, obtenerUsuarios, obtenerCategorias };
