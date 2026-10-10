const path = require('path');

// Carga el archivo .env si existe (Node 20.12+ / 21.7+). Si no existe o la versión es vieja, se ignora.
try {
    if (typeof process.loadEnvFile === 'function') process.loadEnvFile(path.join(__dirname, '..', '..', '.env'));
} catch (_) { /* .env es opcional */ }

const JWT_SECRET = process.env.JWT_SECRET || 'cambia-esta-clave-en-produccion';

if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'cambia-esta-clave-en-produccion') {
    console.warn('AVISO: define la variable JWT_SECRET con una clave propia.');
}

module.exports = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET,
    ROOT_DIR: path.join(__dirname, '..', '..'),
    PUBLIC_DIR: path.join(__dirname, '..', '..', 'public')
};
