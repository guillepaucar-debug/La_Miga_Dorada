// ================= UTILIDADES =================
function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[char]));
}

function formatPrice(value) {
    return '$' + Number(value || 0).toFixed(2);
}

function showToast(title, subtitle) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-title').textContent = title;
    document.getElementById('toast-subtitle').textContent = subtitle;
    toast.classList.remove('translate-y-24', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-24', 'opacity-0');
    }, 3000);
}

document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('user-dropdown');
    const userLoggedIn = document.getElementById('user-logged-in');
    if (dropdown && userLoggedIn && !userLoggedIn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
    }
});

function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('hidden');
}

