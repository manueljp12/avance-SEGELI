const conexion = require ('../db/conexion')

async function obtenerDatosHome() {
    try{

        //Total de productos
        const [productos] = await conexion.query(
            'SELECT COUNT(*) AS total FROM productos'
        );

        //Ventas del dia
        const [ventas] = await conexion.query(
            'SELECT COUNT(*) AS total FROM ventas WHERE Date(fechaVenta) = CURDATE()' 
        );

        //Stock bajo
        const [stock] = await conexion.query(
            'SELECT COUNT(*) AS total FROM productos WHERE cantidad <=5'
        );

        return{
            success: true,
            totalProductos: productos[0].total,
            ventasDia: ventas[0].total,
            stockBajo: stock[0].total
        };
    } catch (error){
        console.error('Error Home:', error);
        return{
            success: false,
            message: 'Error obteniendo datos del home'
        };
    }
}

module.exports = {obtenerDatosHome}