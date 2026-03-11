let currentScript = null;
let currentStyle = null;
let loadSeq = 0;
let vistasPermitidas = new Set(['home']);
const Swal = window.Swal;

function configurarHeaderSesion() {
  const usuarioEl = document.getElementById('usuarioLogin');
  const btnLogout = document.getElementById('btnLogout');

  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      try {
        if (Swal && typeof Swal.fire === 'function') {
          const result = await Swal.fire({
            title: '¿Cerrar sesión?',
            text: 'Se cerrará tu sesión actual',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí',
            cancelButtonText: 'Cancelar'
          });

          if (!result.isConfirmed) return;
          await window.api.logout();
          return;
        }

        const confirmado = window.confirm('¿Cerrar sesión?\nSe cerrará tu sesión actual.');
        if (!confirmado) return;
        await window.api.logout();
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        if (Swal && typeof Swal.fire === 'function') {
          await Swal.fire({
            title: 'Error',
            text: 'No se pudo cerrar la sesión',
            icon: 'error'
          });
        } else {
          window.alert('No se pudo cerrar la sesión');
        }
      }
    });
  }

  window.api.obtenerSesion()
    .then((response) => {
      if (!usuarioEl) return;
      const nombre= response?.sesion?.nombre ?? '';
      const apellido= response?.sesion?.apellido ?? '';
      const usuario= `${nombre} ${apellido}`.trim();
      usuarioEl.textContent = usuario ? `Usuario: ${usuario}` : 'Usuario no disponible';
    })
    .catch((error) => {
      if (usuarioEl) usuarioEl.textContent = 'Usuario no disponible';
      console.error('No se pudo obtener la sesion actual:', error);
    });
}

function puedeAccederVista(viewName) {
  return vistasPermitidas.has(viewName);
}

function aplicarVisibilidadMenu() {
  document.querySelectorAll('.sidebar button[data-view]').forEach((button) => {
    const viewName = button.dataset.view;
    const menuItem = button.closest('li');
    if (!menuItem) return;
    menuItem.style.display = puedeAccederVista(viewName) ? '' : 'none';
  });
}

async function cargarPermisosDeVista() {
  try {
    const response = await window.api.layoutObtenerVistasPermitidas();
    if (response && response.success && Array.isArray(response.vistas) && response.vistas.length > 0) {
      vistasPermitidas = new Set(response.vistas);
    } else {
      vistasPermitidas = new Set(['home']);
    }
  } catch (error) {
    console.error('No se pudieron cargar los permisos de vista:', error);
    vistasPermitidas = new Set(['home']);
  }

  aplicarVisibilidadMenu();
}

function loadView(viewName) {
  const seq = ++loadSeq;
  const content = document.getElementById('content');
  if (!content) return;

  if (!puedeAccederVista(viewName)) {
    content.textContent = 'No tiene permisos para esta vista';
    return;
  }

  window.api.layoutLoadView(viewName)
    .then((res) => {
      if (seq !== loadSeq) return;
      if (!res.success) {
        throw new Error(res.message || 'No se pudo cargar la vista');
      }

      const html = res.html || '';
      content.innerHTML = html;

      if (currentScript) {
        currentScript.remove();
        currentScript = null;
      }

      if (currentStyle) {
        currentStyle.remove();
        currentStyle = null;
      }

      currentScript = document.createElement('script');
      currentScript.src = `./views/${viewName}/${viewName}.js?v=${seq}`;
      currentScript.onload = function () {
        if (seq !== loadSeq) return;
        const initFn = 'init' + capitalize(viewName);
        if (typeof window[initFn] === 'function') {
          window[initFn]();
        }
      };
      currentScript.onerror = function (e) {
        console.error('Error cargando script:', e);
      };
      document.body.appendChild(currentScript);

      currentStyle = document.createElement('link');
      currentStyle.rel = 'stylesheet';
      currentStyle.href = `./views/${viewName}/${viewName}.css?v=${seq}`;
      currentStyle.onerror = function (e) {
        console.error('Error cargando CSS:', e);
      };
      document.head.appendChild(currentStyle);
    })
    .catch((err) => {
      if (seq !== loadSeq) return;
      console.error('Error cargando vista:', err);
      content.textContent = `Error al cargar la vista: ${err.message}`;
    });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

window.onload = async function () {
  configurarHeaderSesion();
  await cargarPermisosDeVista();
  const vistaInicial = puedeAccederVista('home') ? 'home' : (Array.from(vistasPermitidas)[0] || 'home');
  loadView(vistaInicial);
};

window.loadView = loadView;
