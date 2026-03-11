const conexion =  require('../db/conexion')

async function guardarVenta(data, idUsuario) {
    const {observacion, productos} = data;
    if (!Array.isArray(productos) || productos.length === 0) {
        return { success: false, message: 'Debe agregar al menos un producto' };
    }

    const conn = await conexion.getConnection();
    try{
        await conn.beginTransaction();

        // Calcular total con precios del servidor, no del cliente.
        let total = 0;
        const detalleNormalizado = [];

        for (const p of productos) {
            const cantidad = Number.parseInt(p.cantidad, 10);
            if (!Number.isInteger(cantidad) || cantidad <= 0) {
                throw new Error('Cantidad invalida para uno de los productos');
            }

            const [[producto]] = await conn.query(
                'SELECT cantidad, precioDetal FROM productos WHERE idProducto = ? FOR UPDATE',
                [p.idProducto]
            );

            if (!producto || producto.cantidad < cantidad) {
                throw new Error(`Stock insuficiente para el producto ID ${p.idProducto}`);
            }

            const precioUnitario = Number(producto.precioDetal);
            const subtotal = Number((cantidad * precioUnitario).toFixed(2));
            total += subtotal;

            detalleNormalizado.push({
                idProducto: p.idProducto,
                cantidad,
                precioUnitario,
                subtotal
            });
        }

        const [venta] = await conn.query(
            `INSERT INTO ventas (fechaVenta, idUsuario, total, observacion) 
            VALUES (NOW(), ?, ?, ?)`, 
            [idUsuario, Number(total.toFixed(2)), observacion]
        );

        const idVenta = venta.insertId;
        
        
        //Insertar detalle + actualizar stock

        for(const p of detalleNormalizado) {
            await conn.query(
                `INSERT INTO venta_detalle 
                (idVenta, idProducto, cantidadVendida, precioUnitario, subtotal)
                VALUES (?, ?, ?, ?, ?)`,
                [idVenta, p.idProducto, p.cantidad, p.precioUnitario, p.subtotal]
            );
            await conn.query(
                `UPDATE productos 
                SET cantidad = cantidad - ?
                WHERE idProducto = ?`,
                [p.cantidad, p.idProducto]
            );
        }

        await conn.commit();
        return{success: true};
    } catch(error){
        await conn.rollback();
        console.error('Error venta:', error);
        return{
            success: false,
            message: error.message || 'Error guardando venta'
        };
    }finally{
        conn.release();
    }
}

async function buscarProductosVentas(texto) {
    try {
        

        const [rows] = await conexion.query(
            `SELECT 
                idProducto,
                nombreProducto,
                precioDetal AS precio
             FROM productos
             WHERE nombreProducto LIKE ?
             LIMIT 10`,
            [`%${texto}%`]
        );

        return {
            success: true,
            data: rows
        };

    } catch (error) {
        console.error('Error buscando productos:', error);
        return {
            success: false,
            message: 'Error al buscar productos'
        };
    }
}

module.exports = {guardarVenta, buscarProductosVentas};
