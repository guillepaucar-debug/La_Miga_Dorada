const express = require('express');
const { db } = require('../database/connection');

const router = express.Router();

// Productos
router.get('/', async (req, res) => {
    try {
        const snap = await db.collection('products').where('active', '==', true).get();
        const products = snap.docs
            .map(d => {
                const { id, title, category, tag, price, description, image } = d.data();
                return { id, title, category, tag, price, description, image };
            })
            .sort((a, b) => a.id - b.id);
        res.json({ products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'No se pudieron cargar los productos.' });
    }
});

module.exports = router;
