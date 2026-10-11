const express = require('express');
const { db } = require('../database/connection');

const router = express.Router();

// Productos
router.get('/', async (req, res) => {
    try {
        const snap = await db.collection('products').where('active', '==', true).get();
        const products = snap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id, // ID real del documento en Firestore
                title: data.title,
                category: data.category,
                tag: data.tag,
                price: data.price,
                description: data.description,
                image: data.image
            };
        });
        
        res.json({ products });
    } catch (error) {
        console.error('Error al obtener productos de Firestore:', error);
        res.status(500).json({ message: 'No se pudieron cargar los productos.', products: [] });
    }
});

module.exports = router;