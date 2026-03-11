const conexion = require('../db/conexion');

// ===============================
// PRODUCTOS - CRUD
// ===============================

async function obtenerInventario() {
    try {
        const [rows] = await conexion.query(`
            SELECT
                p.idProducto,
                p.nombreProducto,
                p.idCategoria,
                c.nombreCategoria,
                p.cantidad,
                p.precioFactura,
                p.precioDetal,
                COALESCE(p.stockMinimo, 5) as stockMinimo
            FROM productos p 
            INNER JOIN categoria c ON p.idCategoria = c.idCategoria 
            ORDER BY p.nombreProducto 
        `);
        return { success: true, data: rows };
    } catch (error) {
        console.error('Error Inventario:', error);
        return { success: false, message: 'Error obteniendo inventario' };
    }
}

async function agregarProducto(data) {
    const { nombreProducto, idCategoria, cantidad, precioFactura, precioDetal, stockMinimo = 5 } = data;
    
    if (!nombreProducto || !idCategoria) {
        return { success: false, message: 'Nombre y categoría son requeridos' };
    }
    
    try {
        const [existe] = await conexion.query(
            'SELECT idProducto FROM productos WHERE nombreProducto = ?',
            [nombreProducto]
        );
        
        if (existe.length > 0) {
            return { success: false, message: 'El producto ya existe' };
        }
        
        const [result] = await conexion.query(
            `INSERT INTO productos (nombreProducto, idCategoria, cantidad, precioFactura, precioDetal, stockMinimo)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nombreProducto, idCategoria, cantidad || 0, precioFactura || 0, precioDetal || 0, stockMinimo]
        );
        
        return { success: true, message: 'Producto agregado correctamente', id: result.insertId };
    } catch (error) {
        console.error('Error agregando producto:', error);
        return { success: false, message: 'Error al agregar producto' };
    }
}

async function editarProducto(data) {
    const { idProducto, nombreProducto, idCategoria, cantidad, precioFactura, precioDetal, stockMinimo } = data;
    
    if (!idProducto || !nombreProducto || !idCategoria) {
        return { success: false, message: 'Todos los campos son requeridos' };
    }
    
    try {
        const [existe] = await conexion.query(
            'SELECT idProducto FROM productos WHERE idProducto = ?',
            [idProducto]
        );
        
        if (existe.length === 0) {
            return { success: false, message: 'Producto no encontrado' };
        }
        
        await conexion.query(
            `UPDATE productos 
             SET nombreProducto = ?, idCategoria = ?, cantidad = ?, 
                 precioFactura = ?, precioDetal = ?, stockMinimo = ?
             WHERE idProducto = ?`,
            [nombreProducto, idCategoria, cantidad, precioFactura, precioDetal, stockMinimo || 5, idProducto]
        );
        
        return { success: true, message: 'Producto actualizado correctamente' };
    } catch (error) {
        console.error('Error editando producto:', error);
        return { success: false, message: 'Error al editar producto' };
    }
}

async function eliminarProducto(idProducto) {
    if (!idProducto) {
        return { success: false, message: 'ID de producto requerido' };
    }
    
    try {
        const [existe] = await conexion.query(
            'SELECT idProducto FROM productos WHERE idProducto = ?',
            [idProducto]
        );
        
        if (existe.length === 0) {
            return { success: false, message: 'Producto no encontrado' };
        }
        
        await conexion.query('DELETE FROM productos WHERE idProducto = ?', [idProducto]);
        
        return { success: true, message: 'Producto eliminado correctamente' };
    } catch (error) {
        console.error('Error eliminando producto:', error);
        return { success: false, message: 'Error al eliminar producto' };
    }
}

// ===============================
// CATEGORIAS - CRUD
// ===============================

async function obtenerCategorias() {
    try {
        const [rows] = await conexion.query(`
            SELECT 
                c.idCategoria,
                c.nombreCategoria,
                c.descripcion,
                COUNT(p.idProducto) as totalProductos
            FROM categoria c
            LEFT JOIN productos p ON c.idCategoria = p.idCategoria
            GROUP BY c.idCategoria
            ORDER BY c.nombreCategoria
        `);
        return { success: true, data: rows };
    } catch (error) {
        console.error('Error obteniendo categorias:', error);
        return { success: false, message: 'Error obteniendo categorias' };
    }
}

async function agregarCategoria(data) {
    const { nombreCategoria, descripcion } = data;
    
    if (!nombreCategoria) {
        return { success: false, message: 'El nombre de categoría es requerido' };
    }
    
    try {
        const [existe] = await conexion.query(
            'SELECT idCategoria FROM categoria WHERE nombreCategoria = ?',
            [nombreCategoria]
        );
        
        if (existe.length > 0) {
            return { success: false, message: 'La categoría ya existe' };
        }
        
        const [result] = await conexion.query(
            'INSERT INTO categoria (nombreCategoria, descripcion) VALUES (?, ?)',
            [nombreCategoria, descripcion || '']
        );
        
        return { success: true, message: 'Categoría agregada correctamente', id: result.insertId };
    } catch (error) {
        console.error('Error agregando categoría:', error);
        return { success: false, message: 'Error al agregar categoría' };
    }
}

async function editarCategoria(data) {
    const { idCategoria, nombreCategoria, descripcion } = data;
    
    if (!idCategoria || !nombreCategoria) {
        return { success: false, message: 'ID y nombre de categoría son requeridos' };
    }
    
    try {
        const [existe] = await conexion.query(
            'SELECT idCategoria FROM categoria WHERE idCategoria = ?',
            [idCategoria]
        );
        
        if (existe.length === 0) {
            return { success: false, message: 'Categoría no encontrada' };
        }
        
        await conexion.query(
            'UPDATE categoria SET nombreCategoria = ?, descripcion = ? WHERE idCategoria = ?',
            [nombreCategoria, descripcion || '', idCategoria]
        );
        
        return { success: true, message: 'Categoría actualizada correctamente' };
    } catch (error) {
        console.error('Error editando categoría:', error);
        return { success: false, message: 'Error al editar categoría' };
    }
}

async function eliminarCategoria(idCategoria) {
    if (!idCategoria) {
        return { success: false, message: 'ID de categoría requerido' };
    }
    
    try {
        const [existe] = await conexion.query(
            'SELECT idCategoria FROM categoria WHERE idCategoria = ?',
            [idCategoria]
        );
        
        if (existe.length === 0) {
            return { success: false, message: 'Categoría no encontrada' };
        }
        
        const [productos] = await conexion.query(
            'SELECT idProducto FROM productos WHERE idCategoria = ? LIMIT 1',
            [idCategoria]
        );
        
        if (productos.length > 0) {
            return { success: false, message: 'No se puede eliminar la categoría porque tiene productos asociados' };
        }
        
        await conexion.query('DELETE FROM categoria WHERE idCategoria = ?', [idCategoria]);
        
        return { success: true, message: 'Categoría eliminada correctamente' };
    } catch (error) {
        console.error('Error eliminando categoría:', error);
        return { success: false, message: 'Error al eliminar categoría' };
    }
}

module.exports = {
    obtenerInventario,
    agregarProducto,
    editarProducto,
    eliminarProducto,
    obtenerCategorias,
    agregarCategoria,
    editarCategoria,
    eliminarCategoria
};