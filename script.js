/* ========================================
   Blossomly Copycat - JavaScript
   ======================================== */

let products = [];
let currentModalProduct = null;

// --- Load Products ---
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        const data = await response.json();
        products = data.products || [];
        renderProducts(products);
        buildFilterButtons();
    } catch (err) {
        console.log('No products.json found. Run python3 build.py to generate it.');
        document.getElementById('noProducts').style.display = 'block';
    }

    loadAnnouncement();
}

// --- Load Announcement ---
async function loadAnnouncement() {
    try {
        const response = await fetch('announcement.json');
        const data = await response.json();
        const text = (data.text || '').trim();
        const bar = document.getElementById('announcementBar');

        if (text) {
            document.getElementById('announcementText').textContent = text;
            bar.style.display = 'block';
        } else {
            bar.style.display = 'none';
        }
    } catch (err) {
        console.log('No announcement.json found. Run python3 build.py to generate it.');
    }
}

// --- Render Products ---
function renderProducts(list) {
    const grid = document.getElementById('productGrid');
    const noProducts = document.getElementById('noProducts');

    if (!list || list.length === 0) {
        grid.innerHTML = '';
        noProducts.style.display = 'block';
        return;
    }

    noProducts.style.display = 'none';

    grid.innerHTML = list.map(product => `
        <div class="product-card" onclick="openModal('${product.id}')">
            <div class="product-image">
                ${product.category ? `<span class="product-badge">${product.category}</span>` : ''}
                ${product.image
                    ? `<img src="${product.image}" alt="${product.name}" loading="lazy">`
                    : `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f0ebe3;color:#b8a88a;font-size:3rem;">🌸</div>`
                }
            </div>
            <div class="product-info">
                ${product.category ? `<div class="product-category">${product.category}</div>` : ''}
                <h3 class="product-name">${product.name}</h3>
                <p class="product-desc">${product.description}</p>
                <span class="product-price">${product.price || 'Price on request'}</span>
            </div>
        </div>
    `).join('');
}

// --- Build Filter Buttons ---
function buildFilterButtons() {
    const bar = document.getElementById('filterBar');
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

    bar.innerHTML = `<button class="filter-btn active" data-category="all" onclick="filterByCategory('all')">All</button>`;

    categories.forEach(cat => {
        bar.innerHTML += `<button class="filter-btn" data-category="${cat}" onclick="filterByCategory('${cat}')">${cat}</button>`;
    });
}

// --- Filter by Category ---
function filterByCategory(category) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });

    const filtered = category === 'all'
        ? products
        : products.filter(p => p.category === category);

    renderProducts(filtered);
}

// --- Search / Filter Products ---
function filterProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();

    if (!query) {
        renderProducts(products);
        return;
    }

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        (p.category && p.category.toLowerCase().includes(query))
    );

    renderProducts(filtered);
}

// --- Product Modal (Zoom) ---
function openModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    currentModalProduct = product;

    document.getElementById('modalImage').src = product.image || '';
    document.getElementById('modalImage').alt = product.name;
    document.getElementById('modalCategory').textContent = product.category || '';
    document.getElementById('modalName').textContent = product.name;
    document.getElementById('modalPrice').textContent = product.price || 'Price on request';
    document.getElementById('modalDescription').textContent = product.description;

    document.getElementById('productModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('productModal').classList.remove('active');
    document.body.style.overflow = '';
    currentModalProduct = null;
}

// --- Mobile Menu ---
function toggleMobileMenu() {
    document.getElementById('mobileMenu').classList.toggle('active');
}

function closeMobileMenu() {
    document.getElementById('mobileMenu').classList.remove('active');
}

// --- Search ---
function toggleSearch() {
    const overlay = document.getElementById('searchOverlay');

    if (!overlay.classList.contains('active')) {
        overlay.classList.add('active');
        document.getElementById('searchInput').focus();
    } else {
        overlay.classList.remove('active');
        document.getElementById('searchInput').value = '';
        renderProducts(products);
    }
}

// --- Search on Enter ---
function searchOnEnter(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        filterProducts();
        document.getElementById('searchOverlay').classList.remove('active');
        document.getElementById('searchInput').blur();
        document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
    }
}

// --- Keyboard shortcuts ---
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        if (document.getElementById('searchOverlay').classList.contains('active')) {
            toggleSearch();
        }
    }
});

// --- Init ---
document.addEventListener('DOMContentLoaded', loadProducts);
