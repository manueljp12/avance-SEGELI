document.getElementById('btnLogin').addEventListener('click', async () => {
  const usuario = document.getElementById('user').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorEl = document.getElementById('error');

  errorEl.textContent = '';

  if (!usuario || !password) {
    errorEl.textContent = 'Debe ingresar usuario y contraseña';
    return;
  }

  try {
    const response = await window.api.login(usuario, password);

    if (!response.success) {
      errorEl.textContent = response.message || 'Credenciales incorrectas';
    }
    // SI es correcto, main.js se encarga del cambio de ventana
  } catch (err) {
    errorEl.textContent = 'Error al intentar iniciar sesión';
    console.error(err);
  }
});
