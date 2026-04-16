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

async function fetchOrders() {
    try {
        const resp = await fetch('/api/orders');
        if (!resp.ok) throw new Error('Failed to load');
        const data = await resp.json();
        renderOrders(data);
    } catch (err) {
        ordersContainer.innerHTML = `<p style="color:#cd5c5c; text-align:center; padding:3rem 0;">Error: ${err.message}</p>`;
    }
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
                itemsHtml += `<li>${item.quantity}× ${item.name} — ₹${item.price * item.quantity}</li>`;
            });
        }

        const date = new Date(order.created_at).toLocaleString();
        const status = order.status || 'pending';

        const card = document.createElement('div');
        card.className = 'glass-card order-card';
        card.innerHTML = `
            <div class="order-header">
                <h3>${order.order_number}</h3>
                <span class="status-badge status-${status}">${status}</span>
            </div>
            <p class="order-meta">👤 ${order.customer_name} &nbsp;·&nbsp; 📱 ${order.customer_mobile}</p>
            <p class="order-meta">🕐 ${date}</p>
            <ul class="items-list">${itemsHtml}</ul>
            <p class="order-total">Total: ₹${order.total_price}</p>
        `;
        ordersContainer.appendChild(card);
    });
}
