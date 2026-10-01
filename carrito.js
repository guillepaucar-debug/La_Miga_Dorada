document.addEventListener("DOMContentLoaded", () => {
  renderCart();
});

function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function renderCart() {
  const container = document.getElementById("cart-items-container");
  const cart = getCart();

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-2xl p-8 text-center border border-gray-100">
        <i class="fa-solid fa-basket-shopping text-4xl text-brand-gold/40 mb-3"></i>
        <p class="text-brand-muted text-sm font-medium">Tu carrito está vacío.</p>
        <a href="index.html" class="inline-block mt-4 text-xs bg-brand-dark text-white px-5 py-2.5 rounded-full hover:bg-brand-darkHover">Ir a la tienda</a>
      </div>`;
    updateSummary(0);
    return;
  }

  container.innerHTML = "";
  let subtotal = 0;

  cart.forEach((item) => {
    const itemPrice = typeof item.price === "number" ? item.price : parseFloat(item.price) || 0;
    const itemTotal = itemPrice * item.quantity;
    subtotal += itemTotal;

    const div = document.createElement("div");
    div.className = "bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between gap-4";
    div.innerHTML = `
      <div class="flex items-center space-x-4">
        <img src="${item.image || 'https://via.placeholder.com/100'}" alt="${item.title}" class="w-16 h-16 rounded-xl object-cover">
        <div>
          <h4 class="font-serif font-semibold text-brand-dark text-sm">${item.title}</h4>
          <span class="text-xs text-brand-muted">S/ ${itemPrice.toFixed(2)} c/u</span>
        </div>
      </div>
      <div class="flex items-center space-x-4">
        <div class="flex items-center border border-gray-200 rounded-lg">
          <button onclick="updateQuantity('${item.id}', -1)" class="px-3 py-1 text-xs hover:bg-gray-100 transition-colors">-</button>
          <span class="px-3 py-1 text-xs font-semibold">${item.quantity}</span>
          <button onclick="updateQuantity('${item.id}', 1)" class="px-3 py-1 text-xs hover:bg-gray-100 transition-colors">+</button>
        </div>
        <span class="font-serif font-bold text-sm w-20 text-right">S/ ${itemTotal.toFixed(2)}</span>
        <button onclick="removeItem('${item.id}')" class="text-red-400 hover:text-red-600 text-xs px-2"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
    container.appendChild(div);
  });

  updateSummary(subtotal);
}

function updateQuantity(id, delta) {
  let cart = getCart();
  const item = cart.find((p) => p.id === id);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      cart = cart.filter((p) => p.id !== id);
    }
  }
  saveCart(cart);
  renderCart();
}

function removeItem(id) {
  let cart = getCart();
  cart = cart.filter((p) => p.id !== id);
  saveCart(cart);
  renderCart();
}

function updateSummary(subtotal) {
  const shipping = subtotal > 0 ? 5.50 : 0;
  const discount = 0;
  const total = subtotal - discount + shipping;

  const subtotalEl = document.getElementById("cart-subtotal");
  const shippingEl = document.getElementById("cart-shipping");
  const discountEl = document.getElementById("cart-discount");
  const totalEl = document.getElementById("cart-total");

  if (subtotalEl) subtotalEl.textContent = `S/ ${subtotal.toFixed(2)}`;
  if (shippingEl) shippingEl.textContent = `S/ ${shipping.toFixed(2)}`;
  if (discountEl) discountEl.textContent = `-S/ ${discount.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `S/ ${total.toFixed(2)}`;
}