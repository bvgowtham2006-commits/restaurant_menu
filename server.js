const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'orders.json');

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Initialize DB file if it doesn't exist
const initDB = async () => {
    try {
        await fs.access(DB_FILE);
    } catch {
        await fs.writeFile(DB_FILE, JSON.stringify([]));
    }
};

initDB();

// API: Get all orders
app.get('/api/orders', async (req, res) => {
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        const orders = JSON.parse(data);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read database' });
    }
});

// API: Create new order
app.post('/api/orders', async (req, res) => {
    try {
        const newOrder = req.body;
        // Add server-side timestamp
        newOrder.created_at = new Date().toISOString();
        
        const data = await fs.readFile(DB_FILE, 'utf8');
        const orders = JSON.parse(data);
        
        orders.unshift(newOrder); // Add to beginning (latest first)
        
        await fs.writeFile(DB_FILE, JSON.stringify(orders, null, 2));
        res.status(201).json({ success: true, order: newOrder });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save order' });
    }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
