
// Uso:  npm run migrate            (lee data/la-miga-dorada.sqlite)
//       npm run migrate -- ruta/a/otra.sqlite
// Requiere Node 22.5+ (usa el módulo integrado node:sqlite) y las credenciales de Firebase configuradas.
// Es seguro ejecutarlo más de una vez: no duplica nada.
const path = require('path');
const fs = require('fs');
const { ROOT_DIR } = require('../src/config');

let DatabaseSync;
try {
    ({ DatabaseSync } = require('node:sqlite'));
} catch (_) {
    console.error('Este script necesita Node 22.5 o superior (módulo node:sqlite).');
    process.exit(1);
}

const { db } = require('../src/database/connection');
const { initDb } = require('../src/database/init');

const file = process.argv[2] || path.join(ROOT_DIR, 'data', 'la-miga-dorada.sqlite');
if (!fs.existsSync(file)) {
    console.error('No se encontró la base de datos SQLite en:', file);
    process.exit(1);
}

const iso = s => (s ? new Date(String(s).replace(' ', 'T') + 'Z').toISOString() : new Date().toISOString());

async function main() {
    const sqlite = new DatabaseSync(file, { readOnly: true });
    await initDb();

    // Los ids numéricos viejos se conservan como ids de documento (texto) para no romper nada.
    const users = sqlite.prepare('SELECT * FROM users').all();
    for (const u of users) {
        const email = String(u.email).trim().toLowerCase();
        const id = String(u.id);
        await db.runTransaction(async t => {
            const link = db.collection('emails').doc(encodeURIComponent(email));
            const existing = await t.get(link);
            if (existing.exists && existing.data().userId !== id) {
                console.warn(`Omitido: ${email} ya existe en Firestore con otro id.`);
                return;
            }
            t.set(link, { userId: id });
            t.set(db.collection('users').doc(id), {
                name: u.name,
                email,
                passwordHash: u.password_hash,
                avatar: u.avatar || null,
                createdAt: iso(u.created_at),
                updatedAt: iso(u.updated_at)
            });
        });
    }
    console.log(`Usuarios migrados: ${users.length}`);

    const cart = sqlite.prepare('SELECT * FROM cart_items ORDER BY id').all();
    for (const c of cart) {
        await db.collection('carts').doc(String(c.user_id)).collection('items').doc(String(c.product_id))
            .set({ productId: c.product_id, quantity: c.quantity, addedAt: Date.now() + c.id });
    }
    console.log(`Productos de carrito migrados: ${cart.length}`);

    const orders = sqlite.prepare('SELECT * FROM orders ORDER BY id').all();
    const itemStmt = sqlite.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id');
    let maxId = 0;
    for (const o of orders) {
        const items = itemStmt.all(o.id).map(i => ({
            product_id: i.product_id, title: i.title, price: i.price, quantity: i.quantity, subtotal: i.subtotal
        }));
        await db.collection('orders').doc(String(o.id)).set({
            id: o.id,
            userId: String(o.user_id),
            total: o.total,
            status: o.status,
            address: o.address || '',
            phone: o.phone || '',
            deliveryDate: o.delivery_date || '',
            deliveryTime: o.delivery_time || '',
            notes: o.notes || '',
            items,
            createdAt: iso(o.created_at)
        });
        maxId = Math.max(maxId, o.id);
    }
    // El contador de pedidos nunca baja: si ya hay pedidos nuevos en Firestore, se respeta el número mayor.
    const counterRef = db.collection('counters').doc('orders');
    await db.runTransaction(async t => {
        const snap = await t.get(counterRef);
        const current = snap.exists ? snap.data().value : 0;
        t.set(counterRef, { value: Math.max(current, maxId) });
    });
    console.log(`Pedidos migrados: ${orders.length}`);
    console.log('Listo. Ya puedes borrar la carpeta data/ si quieres.');
}

main().then(() => process.exit(0)).catch(err => {
    console.error('Falló la migración:', err);
    process.exit(1);
});
