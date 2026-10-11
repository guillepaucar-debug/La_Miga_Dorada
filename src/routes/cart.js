const express = require('express');
const { db } = require('../database/connection');
const auth = require('../middleware/auth');

const router = express.Router();

// Carrito de cada usuario: carts/{userId}/items/{productId}
const itemsCol = userId => db.collection('carts').doc(String(userId)).collection('items');

// Carrito
router.get('/', auth, async (req, res) => {
    try {
        const snap = await itemsCol(req.user.id).get();
        const cart = snap.docs.map(d => d.data());
        if (!cart.length) return res.json({ items: [] });

        const productSnaps = await db.getAll(...cart.map(c => db.collection('products').doc(String(c.productId))));
        const byId = new Map(productSnaps.filter(s => s.exists).map(s => [s.data().id, s.data()]));

        const items = cart
            .filter(c => byId.has(c.productId))
            .sort((a, b) => b.addedAt - a.addedAt)
            .map(c => {
                const p = byId.get(c.productId);
                return {
                    product_id: c.productId,
                    quantity: c.quantity,
                    title: p.title,
                    price: p.price,
                    image: p.image,
                    subtotal: Math.round(c.quantity * p.price * 100) / 100
                };
            });
        res.json({ items });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'No se pudo cargar el carrito.' });
    }
});

router.post('/items', auth, async (req, res) => {
    const productId = Number(req.body && req.body.productId);
    const quantity = Number(req.body && req.body.quantity);

    if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: 'Datos del carrito inválidos.' });
    }

    try {
        const product = await db.collection('products').doc(String(productId)).get();
        if (!product.exists || product.data().active !== true) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        const ref = itemsCol(req.user.id).doc(String(productId));
        await db.runTransaction(async t => {
            const current = await t.get(ref);
            t.set(ref, {
                productId,
                quantity,
                addedAt: current.exists ? current.data().addedAt : Date.now()
            });
        });

        res.json({ message: 'Carrito actualizado.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'No se pudo actualizar el carrito.' });
    }
});

router.delete('/items/:productId', auth, async (req, res) => {
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId)) return res.status(400).json({ message: 'Datos del carrito inválidos.' });

    try {
        await itemsCol(req.user.id).doc(String(productId)).delete();
        res.json({ message: 'Producto eliminado del carrito.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'No se pudo eliminar el producto.' });
    }
});

module.exports = router;
