const path = require('path');
const express = require('express');
const { PORT, PUBLIC_DIR } = require('./src/config');
const { initDb } = require('./src/database/init');

const app = express();

// El avatar del perfil viaja como imagen en base64, por eso el límite alto.
app.use(express.json({ limit: '5mb' }));

// API
app.use('/api/products', require('./src/routes/products'));
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/cart', require('./src/routes/cart'));
app.use('/api/orders', require('./src/routes/orders'));

// Cualquier /api desconocida responde JSON (no HTML) para que el front muestre el motivo real.
app.use('/api', (req, res) => res.status(404).json({ message: 'Ruta de la API no encontrada.' }));

// Archivos estáticos: funcionan tanto http://127.0.0.1:3000/ como http://127.0.0.1:3000/public/index.html
app.use('/public', express.static(PUBLIC_DIR));
app.use(express.static(PUBLIC_DIR));
app.get('/', (req, res) => res.redirect('/public/index.html'));

// Errores no controlados
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Error interno del servidor.' });
});

initDb()
    .then(() => app.listen(PORT, () => console.log(`La Miga Dorada en http://127.0.0.1:${PORT}`)))
    .catch(err => {
        console.error('No se pudo iniciar la base de datos:', err);
        process.exit(1);
    });
