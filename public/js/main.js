window.addEventListener('DOMContentLoaded', async () => {
    const tasks = [];

    // Solo se ejecuta lo que la página actual necesita
    if (document.getElementById('product-grid')) tasks.push(loadProducts());
    if (document.getElementById('user-logged-in')) tasks.push(initUserSystem());

    await Promise.all(tasks);

    // perfil.html: solo se puede entrar con sesión iniciada
    if (document.body.dataset.view === 'edit-profile') {
        if (!getToken()) window.location.href = 'login.html';
        else loadEditProfile();
    }
});
