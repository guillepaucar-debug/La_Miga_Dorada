// ================= BACKEND =================
// Si la página no se abre desde el servidor Node (p. ej. Live Server en otro puerto o file://),
// las peticiones se envían igualmente al servidor en el puerto 3000.
const API_URL = (location.protocol === 'file:' || (location.port && location.port !== '5500'))
    ? 'http://127.0.0.1:3000/api'
    : '/api';
const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120";

let productsData = [];
let cartItems = [];
let currentActiveCategory = "Todos";

function getToken() {
    return localStorage.getItem('auth_token');
}

function authHeaders(extra = {}) {
    const token = getToken();
    return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

async function api(url, options = {}) {
    const headers = authHeaders({
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
    });
    const response = await fetch(`${API_URL}${url}`, { ...options, headers });
    let data = {};
    try { data = await response.json(); } catch (_) { }
    if (!response.ok) throw new Error(data.message || 'Ocurrió un error.');
    return data;
}

