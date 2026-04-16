const loginScreen     = document.getElementById('admin-login-screen');
const dashboard       = document.getElementById('admin-dashboard');
const adminForm       = document.getElementById('admin-form');
const passwordInput   = document.getElementById('adminPassword');
const ordersContainer = document.getElementById('orders-container');

adminForm.addEventListener('submit', e => {
    e.preventDefault();
    if (passwordInput.value === 'admin123') {
        loginScreen.classList.remove('active');
        loginScreen.classList.add('hidden');
        dashboard.classList.remove('hidden');
        dashboard.classList.add('active');
        fetchOrders();
        setInterval(fetchOrders, 3000);
    } else {
        alert('Incorrect Password');
    }
});

function fetchOrders() {
    const orders = JSON.parse(localStorage.getItem('spiceRoutesOrders') || '[]');
    renderOrders(orders);
}

function renderOrders(orders) {
    if (!orders || orders.length === 0) {
        ordersContainer.innerHTML = '<p class="no-orders">No orders received yet.</p>';
        return;
    }

    ordersContainer.innerHTML = '';

    orders.forEach(order => {
        let itemsHtml = '';
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                itemsHtml += '<li>' + item.quantity + '\u00D7 ' + item.name + ' \u2014 \u20B9' + (item.price * item.quantity) + '</li>';
            });
        }

        const date = new Date(order.created_at).toLocaleString();
        const status = order.status || 'pending';

        const card = document.createElement('div');
        card.className = 'glass-card order-card';
        card.innerHTML =
            '<div class="order-header">' +
                '<h3>' + order.order_number + '</h3>' +
                '<span class="status-badge status-' + status + '">' + status.toUpperCase() + '</span>' +
            '</div>' +
            '<p class="order-meta">\u{1F464} ' + order.customer_name + ' &nbsp;\u00B7&nbsp; \u{1F4F1} ' + order.customer_mobile + '</p>' +
            '<p class="order-meta">\u{1F550} ' + date + '</p>' +
            '<ul class="items-list">' + itemsHtml + '</ul>' +
            '<p class="order-total">Total: \u20B9' + order.total_price + '</p>';
        ordersContainer.appendChild(card);
    });
}
