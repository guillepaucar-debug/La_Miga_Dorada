// ================= USUARIOS / AUTENTICACIÓN =================
async function initUserSystem() {
    const token = getToken();
    if (!token) {
        updateUIUser(null);
        return;
    }

    // Muestra al instante el usuario guardado para que la cabecera no parpadee al cambiar de página.
    try {
        const cached = JSON.parse(localStorage.getItem('auth_user') || 'null');
        if (cached) updateUIUser(cached);
    } catch (_) { }

    try {
        const data = await api('/auth/me');
        updateUIUser(data.user);
        await loadCart();
    } catch (_) {
        localStorage.removeItem('auth_token');
        updateUIUser(null);
    }
}

function updateUIUser(activeUser) {
    const loggedInDiv = document.getElementById('user-logged-in');
    const loggedOutBtn = document.getElementById('user-logged-out');
    const mobileUserSec = document.getElementById('mobile-user-section');
    if (!loggedInDiv) return; // páginas sin cabecera (login, registro...)

    // Guarda (o borra) el usuario para pintar la cabecera sin esperar al servidor.
    try {
        if (activeUser) localStorage.setItem('auth_user', JSON.stringify(activeUser));
        else localStorage.removeItem('auth_user');
    } catch (_) { }
    loggedInDiv.style.visibility = 'visible';
    loggedOutBtn.style.visibility = 'visible';

    if (activeUser) {
        const userAvatar = activeUser.avatar || DEFAULT_AVATAR;
        document.getElementById('user-display-name').textContent = activeUser.name;
        document.getElementById('user-avatar').src = userAvatar;
        document.getElementById('dropdown-user-email').textContent = activeUser.email;

        loggedInDiv.classList.remove('hidden');
        loggedInDiv.classList.add('flex');
        loggedOutBtn.classList.add('hidden');

        mobileUserSec.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <img src="${userAvatar}" class="w-8 h-8 rounded-full object-cover">
                    <span class="text-sm font-medium text-brand-dark">${escapeHtml(activeUser.name)}</span>
                </div>
                <div class="flex items-center space-x-3">
                    <button onclick="openAuthModal('edit-profile')" class="text-xs text-brand-gold font-medium">Editar</button>
                    <button onclick="logoutUser()" class="text-xs text-red-600 font-medium">Cerrar sesión</button>
                </div>
            </div>`;
    } else {
        loggedInDiv.classList.add('hidden');
        loggedInDiv.classList.remove('flex');
        loggedOutBtn.classList.remove('hidden');
        mobileUserSec.innerHTML = `
            <button onclick="openAuthModal('login')" class="w-full bg-brand-dark text-white py-2.5 rounded-xl text-xs font-medium">
                Iniciar Sesión / Registrarse
            </button>`;
    }
}

// Las pantallas de autenticación ahora son páginas independientes.
const AUTH_PAGES = {
    'login': 'login.html',
    'register': 'register.html',
    'reset': 'recuperar.html',
    'edit-profile': 'perfil.html'
};

function openAuthModal(view) {
    window.location.href = AUTH_PAGES[view] || AUTH_PAGES.login;
}

// Después de iniciar sesión, registrarse o guardar el perfil se vuelve al inicio.
function closeAuthModal() {
    window.location.href = 'index.html';
}

function switchAuthView(view) {
    openAuthModal(view);
}

async function loadEditProfile() {
    try {
        const data = await api('/auth/me');
        document.getElementById('edit-name').value = data.user.name || '';
        document.getElementById('edit-avatar-preview').src = data.user.avatar || DEFAULT_AVATAR;
    } catch (_) { }
}

function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
}

async function handleLogin(e) {
    e.preventDefault();
    const errorEl = document.getElementById('login-error');
    errorEl.classList.add('hidden');

    try {
        const data = await api('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: document.getElementById('login-email').value.trim(),
                password: document.getElementById('login-password').value
            })
        });

        localStorage.setItem('auth_token', data.token);
        updateUIUser(data.user);
        await loadCart();
        closeAuthModal();
        showToast("¡Bienvenido!", `Iniciaste sesión como ${data.user.name}`);
        document.getElementById('login-password').value = '';
    } catch (error) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('hidden');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const errorEl = document.getElementById('register-error');
    errorEl.classList.add('hidden');

    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    if (password !== confirmPassword) {
        errorEl.textContent = "Las contraseñas no coinciden.";
        errorEl.classList.remove('hidden');
        return;
    }

    try {
        const data = await api('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                name: document.getElementById('reg-name').value.trim(),
                email: document.getElementById('reg-email').value.trim(),
                password
            })
        });

        localStorage.setItem('auth_token', data.token);
        updateUIUser(data.user);
        await loadCart();
        closeAuthModal();
        showToast("Cuenta Creada", `¡Bienvenido/a ${data.user.name}!`);
        e.target.reset();
    } catch (error) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('hidden');
    }
}

async function handleResetPassword(e) {
    e.preventDefault();
    const errorEl = document.getElementById('reset-error');
    errorEl.classList.add('hidden');

    try {
        await api('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({
                email: document.getElementById('reset-email').value.trim(),
                newPassword: document.getElementById('reset-new-password').value
            })
        });

        e.target.reset();
        switchAuthView('login');
        showToast("Contraseña actualizada", "Ya puedes iniciar sesión con tu nueva clave.");
    } catch (error) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('hidden');
    }
}

function handleFileAvatarChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        showToast("Imagen demasiado grande", "Usa una imagen de máximo 2 MB.");
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = e => document.getElementById('edit-avatar-preview').src = e.target.result;
    reader.readAsDataURL(file);
}

async function handleSaveProfile(e) {
    e.preventDefault();
    try {
        const data = await api('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify({
                name: document.getElementById('edit-name').value.trim(),
                avatar: document.getElementById('edit-avatar-preview').src
            })
        });

        updateUIUser(data.user);
        closeAuthModal();
        showToast("Perfil Actualizado", "Tus cambios se guardaron en la base de datos.");
    } catch (error) {
        showToast("No se pudo guardar", error.message);
    }
}

async function logoutUser() {
    try {
        if (getToken()) await api('/auth/logout', { method: 'POST' });
    } catch (_) { }

    localStorage.removeItem('auth_token');
    cartItems = [];
    updateCartCount();
    updateUIUser(null);
    document.getElementById('user-dropdown').classList.add('hidden');
    showToast("Sesión cerrada", "Has cerrado tu sesión correctamente.");
}

function toggleUserDropdown() {
    document.getElementById('user-dropdown').classList.toggle('hidden');
}
