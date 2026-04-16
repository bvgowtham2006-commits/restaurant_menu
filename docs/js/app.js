// === STATE ===
let currentUser = { name: '', mobile: '' };
let currentCategory = '';
let currentFilter = 'all';
let searchQuery = '';
let cart = {};

// === DOM ===
const entryScreen     = document.getElementById('entry-screen');
const menuScreen      = document.getElementById('menu-screen');
const entryForm       = document.getElementById('entry-form');
const dishGrid        = document.getElementById('dish-grid');
const searchInput     = document.getElementById('search-input');
const cartBar         = document.getElementById('cart-bar');
const checkoutModal   = document.getElementById('checkout-modal');
const successScreen   = document.getElementById('success-screen');
const categoryPicker  = document.getElementById('category-picker');
const dishListView    = document.getElementById('dish-list-view');
const toolbarRow      = document.getElementById('toolbar-row');
const categoryNavRow  = document.getElementById('category-nav-row');
const dishListTitle   = document.getElementById('dish-list-title');

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
    const stored = localStorage.getItem('spiceRoutesUser');
    if (stored) {
        currentUser = JSON.parse(stored);
        showMenuScreen();
    }
    setupEventListeners();
});

// === EVENTS ===
function setupEventListeners() {
    entryForm.addEventListener('submit', e => {
        e.preventDefault();
        const name   = document.getElementById('userName').value.trim();
        const mobile = document.getElementById('userMobile').value.trim();
        if (name && mobile) {
            currentUser = { name, mobile };
            localStorage.setItem('spiceRoutesUser', JSON.stringify(currentUser));
            showMenuScreen();
        } else {
            alert('Please enter your name and mobile number.');
        }
    });

    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => openCategory(card.dataset.cat));
    });

    document.getElementById('back-to-categories').addEventListener('click', showCategoryPicker);

    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.dataset.cat;
            searchQuery = '';
            searchInput.value = '';
            dishListTitle.textContent = currentCategory;
            renderDishes();
        });
    });

    searchInput.addEventListener('input', e => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderDishes();
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderDishes();
        });
    });

    document.getElementById('view-cart-btn').addEventListener('click', showCheckoutModal);
    document.getElementById('close-checkout').addEventListener('click', hideCheckoutModal);
    document.getElementById('place-order-btn').addEventListener('click', placeOrder);
    document.getElementById('back-to-menu').addEventListener('click', resetAfterOrder);
}

// === SCREEN CONTROL ===
function showMenuScreen() {
    entryScreen.classList.remove('active');
    entryScreen.classList.add('hidden');
    menuScreen.classList.remove('hidden');
    menuScreen.classList.add('active');
    document.getElementById('welcome-name').textContent = '\u{1F464} ' + currentUser.name;
    showCategoryPicker();
}

function showCategoryPicker() {
    categoryPicker.classList.remove('hidden');
    dishListView.classList.add('hidden');
    toolbarRow.classList.add('hidden');
    categoryNavRow.classList.add('hidden');
    searchQuery = '';
    currentFilter = 'all';
    if (searchInput) searchInput.value = '';
    document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.filter === 'all');
    });
}

function openCategory(catName) {
    currentCategory = catName;
    searchQuery = '';
    if (searchInput) searchInput.value = '';
    categoryPicker.classList.add('hidden');
    dishListView.classList.remove('hidden');
    toolbarRow.classList.remove('hidden');
    categoryNavRow.classList.remove('hidden');
    document.querySelectorAll('.cat-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.cat === catName);
    });
    dishListTitle.textContent = catName;
    renderDishes();
}

// === RENDER DISHES ===
function renderDishes() {
    dishGrid.innerHTML = '';
    const filtered = menuData.filter(dish => {
        if (searchQuery === '' && dish.category !== currentCategory) return false;
        if (currentFilter !== 'all' && dish.type !== currentFilter) return false;
        if (searchQuery !== '') {
            if (dish.name.toLowerCase().includes(searchQuery)) return true;
            if (dish.category.toLowerCase().includes(searchQuery)) return true;
            const dishWords  = dish.name.toLowerCase().split(' ');
            const queryWords = searchQuery.split(' ');
            for (const dw of dishWords) {
                for (const qw of queryWords) {
                    if (qw.length > 2 && stringSimilarity.compareTwoStrings(dw, qw) >= 0.70) return true;
                }
            }
            return false;
        }
        return true;
    });

    if (filtered.length === 0) {
        dishGrid.innerHTML = '<p class="no-results">No dishes found. Try a different search.</p>';
        return;
    }

    filtered.forEach(dish => {
        const qty = cart[dish.id] || 0;
        const card = document.createElement('div');
        card.className = 'dish-card';
        card.innerHTML =
            '<img src="' + dish.image + '" alt="' + dish.name + '" class="dish-img" loading="lazy">' +
            '<div class="dish-info">' +
                '<div class="dish-header">' +
                    '<span class="dish-title">' + dish.name + '</span>' +
                    '<span class="veg-mark ' + dish.type + '" title="' + (dish.type === 'veg' ? 'Vegetarian' : 'Non-Vegetarian') + '"></span>' +
                '</div>' +
                '<p class="dish-desc">' + dish.desc + '</p>' +
                '<div class="dish-footer">' +
                    '<span class="dish-price">\u20B9' + dish.price + '</span>' +
                    (qty === 0
                        ? '<button class="add-btn" onclick="updateCart(\'' + dish.id + '\', 1)">Add to Basket</button>'
                        : '<div class="qty-controls">' +
                              '<button class="qty-btn" onclick="updateCart(\'' + dish.id + '\', -1)">\u2212</button>' +
                              '<span class="qty-value">' + qty + '</span>' +
                              '<button class="qty-btn" onclick="updateCart(\'' + dish.id + '\', 1)">+</button>' +
                          '</div>'
                    ) +
                '</div>' +
            '</div>';
        dishGrid.appendChild(card);
    });
}

// === CART ===
window.updateCart = function(itemId, change) {
    if (!cart[itemId]) cart[itemId] = 0;
    cart[itemId] += change;
    if (cart[itemId] <= 0) delete cart[itemId];
    updateCartBar();
    renderDishes();
};

function updateCartBar() {
    let totalItems = 0, totalPrice = 0;
    for (const [id, qty] of Object.entries(cart)) {
        const item = menuData.find(d => d.id === id);
        if (item) { totalItems += qty; totalPrice += qty * item.price; }
    }
    document.getElementById('cart-total-items').textContent = totalItems + ' Item' + (totalItems !== 1 ? 's' : '');
    document.getElementById('cart-total-price').textContent = '\u20B9' + totalPrice;
    totalItems > 0 ? cartBar.classList.add('visible') : (cartBar.classList.remove('visible'), hideCheckoutModal());
}

// === CHECKOUT ===
function showCheckoutModal() {
    if (!Object.keys(cart).length) return;
    const list = document.getElementById('cart-items-list');
    list.innerHTML = '';
    let totalPrice = 0;

    for (const [id, qty] of Object.entries(cart)) {
        const item = menuData.find(d => d.id === id);
        if (!item) continue;
        const itemTotal = qty * item.price;
        totalPrice += itemTotal;
        list.innerHTML +=
            '<div class="cart-item">' +
                '<div class="cart-item-info">' +
                    '<div class="cart-item-title"><span class="veg-mark ' + item.type + '"></span>' + item.name + '</div>' +
                    '<div class="cart-item-price">' + qty + ' \u00D7 \u20B9' + item.price + '</div>' +
                '</div>' +
                '<strong>\u20B9' + itemTotal + '</strong>' +
            '</div>';
    }

    const itemsCount = Object.values(cart).reduce((a, b) => a + b, 0);
    const eta = Math.min(Math.max(20 + itemsCount * 2, 20), 60);
    document.getElementById('est-time').textContent   = eta + ' mins';
    document.getElementById('final-price').textContent = '\u20B9' + totalPrice;
    checkoutModal.classList.remove('hidden');
}

function hideCheckoutModal() { checkoutModal.classList.add('hidden'); }

// === PLACE ORDER (localStorage) ===
function placeOrder() {
    const btn = document.getElementById('place-order-btn');
    btn.textContent = 'Placing Order...';
    btn.disabled = true;

    const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    let totalPrice = 0;
    const finalItems = [];

    for (const [id, qty] of Object.entries(cart)) {
        const item = menuData.find(d => d.id === id);
        if (item) {
            totalPrice += qty * item.price;
            finalItems.push({ name: item.name, quantity: qty, price: item.price });
        }
    }

    const orderData = {
        order_number:    orderNumber,
        customer_name:   currentUser.name,
        customer_mobile: currentUser.mobile,
        items:           finalItems,
        total_price:     totalPrice,
        status:          'pending',
        created_at:      new Date().toISOString()
    };

    // Save to localStorage
    const existing = JSON.parse(localStorage.getItem('spiceRoutesOrders') || '[]');
    existing.unshift(orderData);
    localStorage.setItem('spiceRoutesOrders', JSON.stringify(existing));

    hideCheckoutModal();
    cartBar.classList.remove('visible');
    document.getElementById('success-order-id').textContent = orderNumber;
    successScreen.classList.remove('hidden');
    cart = {};

    btn.textContent = 'Confirm & Place Order';
    btn.disabled = false;
}

function resetAfterOrder() {
    successScreen.classList.add('hidden');
    showCategoryPicker();
    updateCartBar();
}
