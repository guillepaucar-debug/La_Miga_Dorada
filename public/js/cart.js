// ================= CARRITO + BASE DE DATOS =================
async function loadCart() {
    if (!getToken()) {
        cartItems = [];
        updateCartCount();
        return;
    }

    try {
        const data = await api('/cart');
        cartItems = data.items || [];
        updateCartCount();
    } catch (_) {
        cartItems = [];
        updateCartCount();
    }
}

function updateCartCount() {
    const count = cartItems.reduce((sum, item) => sum + Number(item.quantity), 0);
    const badge = document.getElementById('cart-count');
    if (badge) badge.textContent = count;
}

async function addItemToCart(productId) {
    if (!getToken()) {
        openAuthModal('login');
        showToast("Inicia sesión", "Necesitas una cuenta para guardar tu carrito.");
        return;
    }

    try {
        await api('/cart/items', {
            method: 'POST',
            body: JSON.stringify({ productId, quantity: 1 })
        });
        await loadCart();
        const product = productsData.find(p => p.id === productId);
        showToast(product ? product.title : "Producto", "Se ha añadido al carrito de compras");
    } catch (error) {
        showToast("No se pudo añadir", error.message);
    }
}

async function openCartModal() {
    // Paso A: validación de sesión
    if (!getToken()) {
        openAuthModal('login');
        showToast("Inicia sesión", "Tu carrito se guarda en tu cuenta.");
        return;
    }

    await loadCart();
    renderCartModal();
    setCartView('cart');
    const modal = document.getElementById('cart-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeCartModal() {
    const modal = document.getElementById('cart-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    // Se reinicia: la próxima vez se ve el carrito (vacío y en $0.00 si ya se hizo un pedido)
    setCartView('cart');
    renderCartModal();
}

function renderCartModal() {
    const list = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total');

    if (!cartItems.length) {
        list.innerHTML = `
            <div class="py-10 text-center text-brand-muted">
                <i class="fa-solid fa-bag-shopping text-3xl text-brand-gold/50 mb-3"></i>
                <p class="text-sm">Tu carrito está vacío.</p>
            </div>`;
        totalEl.textContent = formatPrice(0);
        setConfirmEnabled(false);
        return;
    }

    list.innerHTML = cartItems.map(item => `
        <div class="flex items-center gap-3 py-3 border-b border-gray-100">
            <img src="${item.image}" class="w-16 h-16 rounded-xl object-cover" alt="${escapeHtml(item.title)}">
            <div class="flex-1 min-w-0">
                <p class="font-serif text-base truncate">${escapeHtml(item.title)}</p>
                <p class="text-xs text-brand-muted">${formatPrice(item.price)} × ${item.quantity}</p>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="changeCartQuantity(${item.product_id}, ${item.quantity - 1})" class="w-7 h-7 rounded-full bg-gray-100">−</button>
                <span class="text-xs font-semibold">${item.quantity}</span>
                <button onclick="changeCartQuantity(${item.product_id}, ${item.quantity + 1})" class="w-7 h-7 rounded-full bg-gray-100">+</button>
            </div>
        </div>`).join('');

    const total = cartItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    totalEl.textContent = formatPrice(total);
    setConfirmEnabled(true);
}

function setConfirmEnabled(enabled) {
    const btn = document.getElementById('cart-confirm-btn');
    if (btn) btn.disabled = !enabled;
}

async function changeCartQuantity(productId, quantity) {
    try {
        if (quantity <= 0) {
            await api(`/cart/items/${productId}`, { method: 'DELETE' });
        } else {
            await api('/cart/items', {
                method: 'POST',
                body: JSON.stringify({ productId, quantity })
            });
        }
        await loadCart();
        renderCartModal();
    } catch (error) {
        showToast("Error del carrito", error.message);
    }
}

// ================= CONFIRMAR PEDIDO =================
const CART_VIEWS = {
    cart:     { id: 'cart-view-cart',     title: 'Tu carrito',        subtitle: 'Tus productos se guardan en tu cuenta.' },
    checkout: { id: 'cart-view-checkout', title: 'Confirmar pedido',  subtitle: 'Indica dónde y cuándo quieres recibirlo.' },
    success:  { id: 'cart-view-success',  title: 'Pedido confirmado', subtitle: 'Gracias por elegir La Miga Dorada.' }
};

function setCartView(view) {
    Object.entries(CART_VIEWS).forEach(([name, v]) => {
        document.getElementById(v.id).style.display = name === view ? '' : 'none';
    });
    document.getElementById('cart-title').textContent = CART_VIEWS[view].title;
    document.getElementById('cart-subtitle').textContent = CART_VIEWS[view].subtitle;
}

function cartTotal() {
    return cartItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
}

function localDateStr(date = new Date()) {
    const z = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${z(date.getMonth() + 1)}-${z(date.getDate())}`;
}

function showCheckoutError(message) {
    const el = document.getElementById('checkout-error');
    el.textContent = message || '';
    el.classList.toggle('hidden', !message);
}

// Paso A: si no hay sesión se manda al login; Paso B: se muestran los datos de entrega
function startCheckout() {
    if (!getToken()) {
        closeCartModal();
        openAuthModal('login');
        showToast("Inicia sesión", "Necesitas una cuenta para confirmar tu pedido.");
        return;
    }
    if (!cartItems.length) {
        showToast("Carrito vacío", "Agrega productos antes de confirmar tu pedido.");
        return;
    }

    document.getElementById('checkout-summary').innerHTML = `
        <p class="font-semibold text-brand-dark mb-2 text-xs uppercase tracking-wider">Resumen</p>
        ${cartItems.map(item => `
            <div class="flex justify-between gap-3 py-0.5">
                <span class="text-brand-muted truncate">${item.quantity} × ${escapeHtml(item.title)}</span>
                <span class="text-brand-dark font-medium shrink-0">${formatPrice(Number(item.price) * Number(item.quantity))}</span>
            </div>`).join('')}`;
    document.getElementById('checkout-total').textContent = formatPrice(cartTotal());

    // Datos usados en el pedido anterior (solo se guardan en este navegador)
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('delivery_info') || '{}'); } catch (_) { }
    document.getElementById('co-address').value = saved.address || '';
    document.getElementById('co-phone').value = saved.phone || '';
    document.getElementById('co-notes').value = '';

    const dateInput = document.getElementById('co-date');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = localDateStr();
    dateInput.value = localDateStr(tomorrow);
    refreshDeliveryTimes();

    showCheckoutError('');
    setCartView('checkout');
}

function backToCart() {
    showCheckoutError('');
    setCartView('cart');
}

// Horas disponibles según el día: lun-sáb 8:00-20:00, domingo 9:00-15:00
function refreshDeliveryTimes() {
    const dateStr = document.getElementById('co-date').value;
    const select = document.getElementById('co-time');
    select.innerHTML = '';
    if (!dateStr) return;

    const [y, m, d] = dateStr.split('-').map(Number);
    const isSunday = new Date(y, m - 1, d).getDay() === 0;
    const [open, close] = isSunday ? [9 * 60, 15 * 60] : [8 * 60, 20 * 60];

    let slots = [];
    for (let t = open; t <= close - 30; t += 30) slots.push(t);

    if (dateStr === localDateStr()) {
        const now = new Date();
        const earliest = now.getHours() * 60 + now.getMinutes() + 60; // mínimo 1 hora de margen
        slots = slots.filter(t => t >= earliest);
    }

    if (!slots.length) {
        select.innerHTML = '<option value="">Sin horarios, elige otra fecha</option>';
        return;
    }
    const z = n => String(n).padStart(2, '0');
    select.innerHTML = slots.map(t => {
        const label = `${z(Math.floor(t / 60))}:${z(t % 60)}`;
        return `<option value="${label}">${label}</option>`;
    }).join('');
}

// Paso C: se registra el pedido, se vacía el carrito y se muestra el éxito
async function submitOrder(e) {
    e.preventDefault();

    const info = {
        address: document.getElementById('co-address').value.trim(),
        phone: document.getElementById('co-phone').value.trim(),
        deliveryDate: document.getElementById('co-date').value,
        deliveryTime: document.getElementById('co-time').value,
        notes: document.getElementById('co-notes').value.trim()
    };

    if (info.address.length < 6) return showCheckoutError('Ingresa tu dirección de entrega.');
    if (info.phone.replace(/\D/g, '').length < 6) return showCheckoutError('Ingresa un teléfono de contacto válido.');
    if (!info.deliveryDate) return showCheckoutError('Elige la fecha de entrega.');
    if (!info.deliveryTime) return showCheckoutError('Elige la hora de entrega.');
    showCheckoutError('');

    const submitBtn = document.getElementById('checkout-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Procesando...';

    try {
        const data = await api('/orders', { method: 'POST', body: JSON.stringify(info) });

        try { localStorage.setItem('delivery_info', JSON.stringify({ address: info.address, phone: info.phone })); } catch (_) { }

        // El servidor ya vació el carrito: se actualiza lo que se ve
        cartItems = [];
        updateCartCount();
        renderOrderSuccess(data.order);
        setCartView('success');
        showToast("¡Tu pedido ha sido realizado con éxito!", "Te enviaremos los detalles.");
    } catch (error) {
        if (!getToken() || /sesión/i.test(error.message)) {
            closeCartModal();
            openAuthModal('login');
            showToast("Inicia sesión", "Tu sesión expiró. Vuelve a iniciar sesión.");
        } else {
            showCheckoutError(error.message);
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Realizar pedido';
    }
}

function renderOrderSuccess(order) {
    const [y, m, d] = order.deliveryDate.split('-').map(Number);
    const dateText = new Date(y, m - 1, d).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });

    document.getElementById('cart-view-success').innerHTML = `
        <div class="w-16 h-16 rounded-full bg-brand-gold/15 text-brand-gold flex items-center justify-center mx-auto mb-4 text-2xl">
            <i class="fa-solid fa-check"></i>
        </div>
        <h3 class="font-serif text-2xl text-brand-dark mb-1">¡Tu pedido ha sido registrado!</h3>
        <p class="text-sm text-brand-muted mb-5">Falta un último paso: realiza tu pago para confirmar.</p>
        
        <div class="bg-brand-cream rounded-2xl p-4 text-left text-xs space-y-1.5 mb-6">
            <p><span class="text-brand-muted">Pedido:</span> <span class="font-semibold text-brand-dark">#${order.id}</span></p>
            <p><span class="text-brand-muted">Entrega:</span> <span class="font-semibold text-brand-dark">${escapeHtml(dateText)}, ${escapeHtml(order.deliveryTime)}</span></p>
            <p><span class="text-brand-muted">Dirección:</span> <span class="font-semibold text-brand-dark">${escapeHtml(order.address)}</span></p>
            <p><span class="text-brand-muted">Total a pagar:</span> <span class="font-semibold text-brand-dark">${formatPrice(order.total)}</span></p>
        </div>

        <!-- BOTÓN DIRECTO DE MERCADO PAGO -->
        <a href="https://link.mercadopago.com.pe/lamigadorada" target="_blank" class="w-full bg-[#009EE3] hover:bg-[#0082BD] text-white py-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 mb-3 transition-colors shadow-sm">
            <i class="fa-solid fa-credit-card"></i> Pagar con Mercado Pago / Yape
        </a>

        <button onclick="closeCartModal()" class="w-full bg-brand-dark hover:bg-brand-darkHover text-white py-3 rounded-xl text-xs font-medium">Ya pagué / Cerrar</button>`;
}