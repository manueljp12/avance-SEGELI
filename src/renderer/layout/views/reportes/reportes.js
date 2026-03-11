var categoriaReporte = document.getElementById('categoriaReporte');
var tipoReporte = document.getElementById('tipoReporte');
var btnGenerar = document.getElementById('btnGenerarReporte');
var tbody = document.querySelector('.tabla-resultados tbody');
var thead = document.querySelector('.tabla-resultados thead');
var exportButtons = document.getElementById('exportButtons');
var btnExportExcel = document.getElementById('btnExportExcel');
var btnExportPDF = document.getElementById('btnExportPDF');

var currentReportData = [];
var currentReportTitle = '';

var tiposPorCategoria = {
    inventario: [
        { value: 'stock-actual', text: 'Stock actual' },
        { value: 'bajo-stock', text: 'Productos con bajo stock' },
        { value: 'por-categoria', text: 'Inventario por categoria' }
    ],
    recepcion: [
        { value: 'por-fecha', text: 'Recepciones por rango de fechas' },
        { value: 'por-usuario', text: 'Recepciones por usuario' }
    ],
    ventas: [
        { value: 'por-fecha', text: 'Ventas por rango de fechas' },
        { value: 'por-usuario', text: 'Ventas por usuario' },
        { value: 'por-producto', text: 'Ventas por producto' }
    ],
    usuarios: [
        { value: 'actividad', text: 'Actividad por usuario' }
    ]
};

function setBodyMessage(mensaje) {
    tbody.innerHTML = '';
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = mensaje;
    tr.appendChild(td);
    tbody.appendChild(tr);
}

function renderTabla(data) {
    tbody.innerHTML = '';
    thead.innerHTML = '';

    currentReportData = data;
    currentReportTitle = `${categoriaReporte.value.toUpperCase()} - ${tipoReporte.options[tipoReporte.selectedIndex].text}`;
    exportButtons.style.display = 'flex';

    const headers = Object.keys(data[0]);

    const trHead = document.createElement('tr');
    const thIndex = document.createElement('th');
    thIndex.textContent = '#';
    trHead.appendChild(thIndex);
    headers.forEach((h) => {
        const th = document.createElement('th');
        th.textContent = h;
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    data.forEach((row, index) => {
        const tr = document.createElement('tr');

        const tdIndex = document.createElement('td');
        tdIndex.textContent = String(index + 1);
        tr.appendChild(tdIndex);

        headers.forEach((h) => {
            const td = document.createElement('td');
            const val = row[h];
            td.textContent = val === null || val === undefined ? '' : String(val);
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

async function cargarFiltros() {
    try {
        const usuariosRes = await window.api.obtenerUsuarios();
        const usuarioSelect = document.getElementById('usuario');
        if (usuarioSelect && usuariosRes.data) {
            usuarioSelect.innerHTML = '<option value="">-- Todos --</option>';
            usuariosRes.data.forEach((u) => {
                const option = document.createElement('option');
                option.value = u.idUsuario;
                option.textContent = u.nombre;
                usuarioSelect.appendChild(option);
            });
        }

        const categoriasRes = await window.api.obtenerCategoriasReporte();
        const categoriaSelect = document.getElementById('categoria');
        if (categoriaSelect && categoriasRes.data) {
            categoriaSelect.innerHTML = '<option value="">-- Todas --</option>';
            categoriasRes.data.forEach((c) => {
                const option = document.createElement('option');
                option.value = c.idCategoria;
                option.textContent = c.nombreCategoria;
                categoriaSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando filtros:', error);
    }
}

function exportarExcel() {
    if (currentReportData.length === 0) {
        alert('No hay datos para exportar');
        return;
    }

    const headers = Object.keys(currentReportData[0]);
    let csvContent = '\uFEFF';
    csvContent += `${headers.join(',')}\n`;

    currentReportData.forEach((row) => {
        const values = headers.map((header) => {
            let val = row[header];
            if (val === null || val === undefined) val = '';
            val = String(val);
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                val = `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        });
        csvContent += `${values.join(',')}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentReportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportarPdf() {
    if (currentReportData.length === 0) {
        alert('No hay datos para exportar');
        return;
    }

    const headers = Object.keys(currentReportData[0]);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const table = document.createElement('table');
    table.border = '1';
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';

    const headRow = document.createElement('tr');
    const firstHead = document.createElement('th');
    firstHead.textContent = '#';
    headRow.appendChild(firstHead);
    headers.forEach((h) => {
        const th = document.createElement('th');
        th.textContent = h;
        headRow.appendChild(th);
    });
    const theadTmp = document.createElement('thead');
    theadTmp.appendChild(headRow);
    table.appendChild(theadTmp);

    const tbodyTmp = document.createElement('tbody');
    currentReportData.forEach((row, index) => {
        const tr = document.createElement('tr');
        const tdIndex = document.createElement('td');
        tdIndex.textContent = String(index + 1);
        tr.appendChild(tdIndex);
        headers.forEach((h) => {
            const td = document.createElement('td');
            const val = row[h];
            td.textContent = val === null || val === undefined ? '' : String(val);
            tr.appendChild(td);
        });
        tbodyTmp.appendChild(tr);
    });
    table.appendChild(tbodyTmp);

    printWindow.document.write('<!DOCTYPE html><html><head><title>Reporte</title></head><body></body></html>');
    const h1 = printWindow.document.createElement('h1');
    h1.textContent = currentReportTitle;
    const p = printWindow.document.createElement('p');
    p.textContent = `Generado el: ${new Date().toLocaleString()}`;
    printWindow.document.body.appendChild(h1);
    printWindow.document.body.appendChild(p);
    printWindow.document.body.appendChild(table);
    printWindow.document.close();
    printWindow.print();
}

function initReportes() {
    categoriaReporte.addEventListener('change', () => {
        const categoria = categoriaReporte.value;
        tipoReporte.innerHTML = '';
        tipoReporte.disabled = true;

        if (!categoria) return;

        tipoReporte.disabled = false;
        const base = document.createElement('option');
        base.value = '';
        base.textContent = '-- Seleccione --';
        tipoReporte.appendChild(base);

        tiposPorCategoria[categoria].forEach((tipo) => {
            const option = document.createElement('option');
            option.value = tipo.value;
            option.textContent = tipo.text;
            tipoReporte.appendChild(option);
        });
    });

    btnGenerar.addEventListener('click', async () => {
        const categoria = categoriaReporte.value;
        const tipo = tipoReporte.value;

        if (!categoria || !tipo) {
            alert('Seleccione categoria y tipo de reporte');
            return;
        }

        const filtros = {
            fechaInicio: document.getElementById('fechaInicio').value,
            fechaFin: document.getElementById('fechaFin').value,
            usuario: document.getElementById('usuario').value,
            categoria: document.getElementById('categoria').value,
            stockMinimo: document.getElementById('stockMinimo').value
        };

        setBodyMessage('Cargando...');
        thead.innerHTML = '';

        try {
            const res = await window.api.generarReporte({ categoria, tipo, filtros });
            if (!res.success || !Array.isArray(res.data) || res.data.length === 0) {
                setBodyMessage('No hay resultados');
                exportButtons.style.display = 'none';
                return;
            }
            renderTabla(res.data);
        } catch (error) {
            console.error('Error generando reporte:', error);
            setBodyMessage('Error al generar reporte');
            exportButtons.style.display = 'none';
        }
    });

    btnExportExcel.addEventListener('click', exportarExcel);
    btnExportPDF.addEventListener('click', exportarPdf);

    cargarFiltros();
}

window.initReportes = initReportes;
