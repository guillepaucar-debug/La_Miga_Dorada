const express = require('express');
const { db } = require('../database/connection');
const auth = require('../middleware/auth');
const { validateDelivery } = require('../utils/delivery');

const router = express.Router();

const round2 = n => Math.round(n * 100) / 100;

// Pedidos
router.post('/', auth, async (req, res) => {
    const delivery = validateDelivery(req.body);
    if (delivery.error) return res.status(400).json({ message: delivery.error });
    const { address, phone, deliveryDate, deliveryTime, notes } = delivery.value;

    try {
        const cartCol = db.collection('carts').doc(String(req.user.id)).collection('items');
        const counterRef = db.collection('counters').doc('orders');

        // Todo en una transacción: el número de pedido, el pedido y el vaciado del carrito
        // se guardan juntos o no se guarda nada.
        const result = await db.runTransaction(async t => {
            const cartSnap = await t.get(cartCol);
            if (cartSnap.empty) return { empty: true };

            const cart = cartSnap.docs.map(d => d.data());
            const productSnaps = await t.getAll(...cart.map(c => db.collection('products').doc(String(c.productId))));
            const counterSnap = await t.get(counterRef);

            const items = [];
            cart.forEach((c, i) => {
                const p = productSnaps[i];
                if (!p.exists || p.data().active !== true) return; // producto que ya no se vende
                const { title, price } = p.data();
                items.push({
                    product_id: c.productId,
                    title,
                    price,
                    quantity: c.quantity,
                    subtotal: round2(price * c.quantity)
                });
            });
            if (!items.length) return { empty: true };

            const total = round2(items.reduce((sum, it) => sum + it.subtotal, 0));
            const id = (counterSnap.exists ? counterSnap.data().value : 0) + 1;

            t.set(counterRef, { value: id });
            t.set(db.collection('orders').doc(String(id)), {
                id,
                userId: String(req.user.id),
                total,
                status: 'pendiente',
                address,
                phone,
                deliveryDate,
                deliveryTime,
                notes,
                items,
                createdAt: new Date().toISOString()
            });
            cartSnap.docs.forEach(d => t.delete(d.ref));

            return { id, total };
        });

        if (result.empty) return res.status(400).json({ message: 'El carrito está vacío.' });

        res.status(201).json({
            order: { id: result.id, total: result.total, status: 'pendiente', address, phone, deliveryDate, deliveryTime }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'No se pudo registrar el pedido.' });
    }
});

router.get('/', auth, async (req, res) => {
    try {
        const snap = await db.collection('orders').where('userId', '==', String(req.user.id)).get();
        const orders = snap.docs
            .map(d => d.data())
            .sort((a, b) => b.id - a.id)
            .map(o => ({
                id: o.id,
                total: o.total,
                status: o.status,
                address: o.address,
                phone: o.phone,
                delivery_date: o.deliveryDate,
                delivery_time: o.deliveryTime,
                notes: o.notes,
                created_at: o.createdAt,
                items: o.items
            }));
        res.json({ orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'No se pudieron cargar los pedidos.' });
    }
});

module.exports = router;
