async function loadProducts() {
    try {
        const data = await api('/products');
        productsData = data.products;
        renderProductsGrid("Todos");
    } catch (error) {
        document.getElementById('product-grid').innerHTML = `
            <div class="col-span-full py-16 text-center text-red-500 bg-white rounded-3xl p-8 border border-gray-100">
                No se pudieron cargar los productos. ${escapeHtml(error.message)}
            </div>`;
    }
}

function renderProductsGrid(category = "Todos") {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';

    const filteredList = category === "Todos"
        ? productsData
        : productsData.filter(p => p.category.toLowerCase() === category.toLowerCase());

    document.getElementById('visible-count').textContent = filteredList.length;

    if (!filteredList.length) {
        grid.innerHTML = `
            <div class="col-span-full py-16 text-center text-brand-muted bg-white rounded-3xl p-8 border border-gray-100">
                <i class="fa-solid fa-cookie-bite text-4xl mb-3 text-brand-gold/50"></i>
                <p class="text-base font-medium">No hay productos disponibles en esta categoría actualmente.</p>
            </div>`;
        return;
    }

    filteredList.forEach(product => {
        const card = document.createElement('article');
        card.className = "bg-white rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between border border-gray-100/90 group";
        card.innerHTML = `
            <div>
                <div class="relative h-64 overflow-hidden bg-gray-100">
                    <img src="${product.image}" alt="${escapeHtml(product.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
                    <span class="absolute top-4 left-4 bg-white/95 backdrop-blur-md text-brand-gold text-[10px] font-bold tracking-wider px-3.5 py-1.5 rounded-full uppercase shadow-xs">
                        ${escapeHtml(product.tag)}
                    </span>
                </div>
                <div class="p-6">
                    <h3 class="font-serif text-2xl font-normal text-brand-dark mb-2 leading-snug">${escapeHtml(product.title)}</h3>
                    <p class="text-brand-muted text-xs leading-relaxed font-light">${escapeHtml(product.description)}</p>
                </div>
            </div>
            <div class="px-6 pb-6 pt-2 flex items-center justify-between gap-3">
                <span class="font-serif text-xl font-medium text-brand-dark">${formatPrice(product.price)}</span>
                <button onclick="addItemToCart(${product.id})" class="bg-brand-dark hover:bg-brand-darkHover text-white px-5 py-2.5 rounded-full text-xs font-medium transition-all duration-200 active:scale-95 shadow-xs">
                    Añadir al Carrito
                </button>
            </div>`;
        grid.appendChild(card);
    });
}

function filterCategory(categoryName) {
    currentActiveCategory = categoryName;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.innerText.trim().toLowerCase() === categoryName.toLowerCase()) {
            btn.classList.remove('bg-white', 'text-brand-dark', 'hover:bg-brand-gold/10', 'border', 'border-gray-200');
            btn.classList.add('bg-brand-dark', 'text-white', 'shadow-xs');
        } else {
            btn.classList.remove('bg-brand-dark', 'text-white', 'shadow-xs');
            btn.classList.add('bg-white', 'text-brand-dark', 'hover:bg-brand-gold/10', 'border', 'border-gray-200');
        }
    });
    renderProductsGrid(categoryName);
}

