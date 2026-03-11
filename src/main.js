const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs/promises');

const { login } = require('./controllers/loginController');
const { obtenerDatosHome } = require('./controllers/homeController');
const inventarioCtrl = require('./controllers/inventarioController');
const { guardarRecepcion, buscarProductos } = require('./controllers/recepcionController');
const { guardarVenta, buscarProductosVentas } = require('./controllers/ventasController');
const reportesCtrl = require('./controllers/reportesController');
const usuarioCtrl = require('./controllers/usuarioController');
const devolucionCtrl = require('./controllers/devolucionController');

let loginWin = null;
let mainWin = null;
let sesionActual = null;

const VISTAS_PERMITIDAS = new Set(['home', 'inventario', 'recepcion', 'ventas', 'devoluciones', 'reportes', 'usuarios']);
const VISTAS_POR_ROL = Object.freeze({
  1: ['home', 'inventario', 'recepcion', 'ventas', 'devoluciones', 'reportes', 'usuarios'],
  2: ['home', 'ventas', 'devoluciones', 'reportes']
});

function obtenerVistasPermitidasPorRol(rol) {
  const vistas = VISTAS_POR_ROL[rol] || ['home'];
  return vistas.filter((vista) => VISTAS_PERMITIDAS.has(vista));
}

function createLoginWindow() {
  loginWin = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    webPreferences: { 
      preload: path.join(__dirname, 'preloads.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });
  loginWin.loadFile(path.join(__dirname, 'renderer/login/login.html'));
  loginWin.on('closed', () => { loginWin = null; });
}

function createMainWindow() {
  mainWin = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: { 
      preload: path.join(__dirname, 'preloads.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });
  mainWin.loadFile(path.join(__dirname, 'renderer/layout/layout.html'));
  mainWin.on('closed', () => { mainWin = null; sesionActual = null; });
}

app.whenReady().then(createLoginWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createLoginWindow(); });

// LOGIN
ipcMain.handle('login', async (event, usuario, password) => {
  const result = await login(usuario, password);
  if (result.success) {
    sesionActual = { 
      usuario: result.usuario, 
      idUsuario: result.idUsuario, 
      rol: result.rol, 
      nombre: result.nombre,
      apellido: result.apellido
    };
    if (loginWin) { loginWin.close(); loginWin = null; }
    createMainWindow();
  }
  return result;
});

// LOGOUT
ipcMain.handle('logout', async () => {
  sesionActual = null;
  if (mainWin) { mainWin.close(); mainWin = null; }
  createLoginWindow();
  return { success: true };
});

ipcMain.handle('obtener-sesion', async () => { return { success: true, sesion: sesionActual }; });
ipcMain.handle('layout:vistas-permitidas', async () => {
  if (!sesionActual) return { success: false, message: 'Debe iniciar sesion' };
  return { success: true, vistas: obtenerVistasPermitidasPorRol(sesionActual.rol) };
});
ipcMain.handle('home:datos', async () => { return await obtenerDatosHome(); });
ipcMain.handle('layout:load-view', async (event, viewName) => {
  try {
    if (!sesionActual) {  
      return { success: false, message: 'Debe iniciar sesion' };
    }
    if (!VISTAS_PERMITIDAS.has(viewName)) {
      return { success: false, message: 'Vista no permitida' };
    }
    const vistasPermitidas = new Set(obtenerVistasPermitidasPorRol(sesionActual.rol));
    if (!vistasPermitidas.has(viewName)) {
      return { success: false, message: 'No tiene permisos para esta vista' };
    }
    const rutaVista = path.join(__dirname, 'renderer', 'layout', 'views', viewName, `${viewName}.html`);
    const html = await fs.readFile(rutaVista, 'utf8');
    return { success: true, html };
  } catch (error) {
    console.error('Error cargando vista:', error);
    return { success: false, message: 'No se pudo cargar la vista' };
  }
});

// PRODUCTOS
ipcMain.handle('obtener-inventario', async () => { return await inventarioCtrl.obtenerInventario(); });
ipcMain.handle('producto:agregar', async (event, data) => {
  if (!sesionActual || sesionActual.rol !== 1) return { success: false, message: 'Solo el administrador' };
  return await inventarioCtrl.agregarProducto(data);
});
ipcMain.handle('producto:editar', async (event, data) => {
  if (!sesionActual || sesionActual.rol !== 1) return { success: false, message: 'Solo el administrador' };
  return await inventarioCtrl.editarProducto(data);
});
ipcMain.handle('producto:eliminar', async (event, idProducto) => {
  if (!sesionActual || sesionActual.rol !== 1) return { success: false, message: 'Solo el administrador' };
  return await inventarioCtrl.eliminarProducto(idProducto);
});

// CATEGORIAS
ipcMain.handle('categoria:obtener', async () => { return await inventarioCtrl.obtenerCategorias(); });
ipcMain.handle('categoria:agregar', async (event, data) => {
  if (!sesionActual || sesionActual.rol !== 1) return { success: false, message: 'Solo el administrador' };
  return await inventarioCtrl.agregarCategoria(data);
});
ipcMain.handle('categoria:editar', async (event, data) => {
  if (!sesionActual || sesionActual.rol !== 1) return { success: false, message: 'Solo el administrador' };
  return await inventarioCtrl.editarCategoria(data);
});
ipcMain.handle('categoria:eliminar', async (event, idCategoria) => {
  if (!sesionActual || sesionActual.rol !== 1) return { success: false, message: 'Solo el administrador' };
  return await inventarioCtrl.eliminarCategoria(idCategoria);
});

// RECEPCION
ipcMain.handle('recepcion:guardar', async (event, data) => {
  if (!sesionActual) return { success: false, message: 'Debe iniciar sesión' };
  return await guardarRecepcion(data, sesionActual.idUsuario);
});
ipcMain.handle('productos:buscar', async (event, texto) => { return await buscarProductos(texto); });

// VENTAS
ipcMain.handle('venta:guardar', async (event, data) => {
  if (!sesionActual) return { success: false, message: 'Debe iniciar sesión' };
  return await guardarVenta(data, sesionActual.idUsuario);
});
ipcMain.handle('ventas:buscar', async (event, texto) => { return await buscarProductosVentas(texto); });

// REPORTES
ipcMain.handle('reportes:generar', async (event, data) => {
  if (!sesionActual) return { success: false, message: 'Debe iniciar sesion' };
  return await reportesCtrl.generarReporte(data);
});
ipcMain.handle('reportes:usuarios', async () => {
  if (!sesionActual) return { success: false, message: 'Debe iniciar sesion' };
  return await reportesCtrl.obtenerUsuarios();
});
ipcMain.handle('reportes:categorias', async () => {
  if (!sesionActual) return { success: false, message: 'Debe iniciar sesion' };
  return await reportesCtrl.obtenerCategorias();
});

// USUARIOS
ipcMain.handle('usuarios:obtener', async () => {
  if (!sesionActual || sesionActual.rol !== 1) return { success: false, message: 'Solo el administrador' };
  return await usuarioCtrl.obtenerUsuarios();
});
ipcMain.handle('usuarios:crear', async (event, data) => {
    if (!sesionActual || sesionActual.rol !== 1) return { success: false, message: 'Solo el administrador' };
    return await usuarioCtrl.crearUsuario(data);
});
ipcMain.handle('usuarios:editar', async (event, data) => {
    if (!sesionActual || sesionActual.rol !== 1) return { success: false, message: 'Solo el administrador' };
    return await usuarioCtrl.editarUsuario(data);
});
ipcMain.handle('usuarios:eliminar', async (event, idUsuario) => {
    if (!sesionActual || sesionActual.rol !== 1) return { success: false, message: 'Solo el administrador' };
    return await usuarioCtrl.eliminarUsuario(idUsuario, sesionActual.idUsuario);
});
ipcMain.handle('usuarios:roles', async () => {
  if (!sesionActual || sesionActual.rol !== 1) return { success: false, message: 'Solo el administrador' };
  return await usuarioCtrl.obtenerRoles();
});

// DEVOLUCIONES
ipcMain.handle('devolucion:guardar', async (event, data) => {
    if (!sesionActual) return { success: false, message: 'Debe iniciar sesión' };
    return await devolucionCtrl.guardarDevolucion(data, sesionActual.idUsuario);
});
ipcMain.handle('devolucion:obtener', async () => { return await devolucionCtrl.obtenerDevoluciones(); });
ipcMain.handle('devolucion:productosVenta', async (event, idVenta) => { return await devolucionCtrl.obtenerProductosDeventa(idVenta); });
