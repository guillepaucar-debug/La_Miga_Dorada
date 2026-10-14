// ================= CONTACTO =================
// Formulario "Envíanos un mensaje": valida, envía al servidor (POST /api/contact) y avisa del resultado.
(function () {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const fields = {
        name: document.getElementById('ct-name'),
        email: document.getElementById('ct-email'),
        subject: document.getElementById('ct-subject'),
        message: document.getElementById('ct-message')
    };
    const honeypot = document.getElementById('ct-website');
    const errorBox = document.getElementById('ct-error');
    const successBox = document.getElementById('ct-success');
    const submitBtn = document.getElementById('ct-submit');
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    // Si ya iniciaste sesión, se rellenan tu nombre y correo para ahorrarte tiempo.
    try {
        if (localStorage.getItem('auth_token')) {
            const user = JSON.parse(localStorage.getItem('auth_user') || 'null');
            if (user) {
                if (user.name && !fields.name.value) fields.name.value = user.name;
                if (user.email && !fields.email.value) fields.email.value = user.email;
            }
        }
    } catch (_) { /* sin datos guardados: no pasa nada */ }

    function clearMarks() {
        Object.values(fields).forEach(el => {
            el.classList.remove('ct-invalid');
            el.removeAttribute('aria-invalid');
        });
    }

    function showError(message, field) {
        successBox.hidden = true;
        errorBox.textContent = message;
        errorBox.hidden = false;
        if (field) {
            field.classList.add('ct-invalid');
            field.setAttribute('aria-invalid', 'true');
            field.focus();
        }
    }

    function readValues() {
        return {
            name: fields.name.value.trim(),
            email: fields.email.value.trim(),
            subject: fields.subject.value,
            message: fields.message.value.trim(),
            website: honeypot ? honeypot.value : ''
        };
    }

    // Devuelve { message, field } con el primer problema, o null si todo está bien.
    function validate(v) {
        if (v.name.length < 2) return { message: 'Ingresa tu nombre.', field: fields.name };
        if (!EMAIL_RE.test(v.email)) return { message: 'Ingresa un correo electrónico válido.', field: fields.email };
        if (!v.subject) return { message: 'Elige un asunto.', field: fields.subject };
        if (v.message.length < 10) return { message: 'Escribe tu mensaje (mínimo 10 caracteres).', field: fields.message };
        return null;
    }

    // Quita la marca roja en cuanto la persona vuelve a escribir en ese campo.
    Object.values(fields).forEach(el => {
        const unmark = () => {
            el.classList.remove('ct-invalid');
            el.removeAttribute('aria-invalid');
            errorBox.hidden = true;
        };
        el.addEventListener('input', unmark);
        el.addEventListener('change', unmark);
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (submitBtn.disabled) return;

        clearMarks();
        errorBox.hidden = true;
        successBox.hidden = true;

        const values = readValues();
        const problem = validate(values);
        if (problem) return showError(problem.message, problem.field);

        const label = submitBtn.querySelector('span');
        const originalLabel = label.textContent;
        submitBtn.disabled = true;
        label.textContent = 'Enviando...';

        try {
            await api('/contact', { method: 'POST', body: JSON.stringify(values) });

            form.reset();
            // Tras limpiar, se vuelve a rellenar el nombre y correo de la sesión (si la hay).
            try {
                const user = localStorage.getItem('auth_token') && JSON.parse(localStorage.getItem('auth_user') || 'null');
                if (user) {
                    fields.name.value = user.name || '';
                    fields.email.value = user.email || '';
                }
            } catch (_) { }

            successBox.textContent = '¡Gracias! Hemos recibido tu mensaje y te responderemos lo antes posible.';
            successBox.hidden = false;
            if (typeof showToast === 'function') showToast('¡Mensaje enviado!', 'Te responderemos lo antes posible.');
        } catch (error) {
            const offline = error instanceof TypeError; // fetch no pudo llegar al servidor
            showError(offline
                ? 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'
                : (error.message || 'No se pudo enviar el mensaje. Inténtalo de nuevo.'));
        } finally {
            submitBtn.disabled = false;
            label.textContent = originalLabel;
        }
    });
})();
