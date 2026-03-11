function initHome(){
    console.log('Inicializando home...');
    
    async function cargarDatosHome() {
        try{
            const response = await window.api.obtenerDatosHome();

            if(!response.success){
                throw new Error(response.message);
            }

            const totalProductos = document.getElementById('totalProductos');
            const ventasDia = document.getElementById('ventasDia');
            const stockBajo = document.getElementById('stockBajo');

            if (totalProductos) totalProductos.textContent = response.totalProductos || 0;
            if (ventasDia) ventasDia.textContent = response.ventasDia || 0;
            if (stockBajo) stockBajo.textContent = response.stockBajo || 0;

        } catch (error){
            console.error('Error en home:', error);
        }
    }
    cargarDatosHome();

    const btnRefresh = document.getElementById('btnRefresh');
    if (btnRefresh) {
        btnRefresh.onclick = cargarDatosHome;
    }
    
    console.log('Home inicializado');
}

window.initHome = initHome;

