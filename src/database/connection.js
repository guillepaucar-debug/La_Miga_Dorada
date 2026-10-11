const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // Render u otro hosting: la llave viene en una variable de entorno
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
            projectId: 'lamigadorada-65048'
        });
    } else if (process.env.K_SERVICE) {
        admin.initializeApp({ projectId: 'lamigadorada-65048' });
    } else {
        const keyPath = path.resolve(__dirname, '../../firebase-key.json');
        if (!fs.existsSync(keyPath)) throw new Error(`No se encontró el archivo: ${keyPath}`);
        admin.initializeApp({
            credential: admin.credential.cert(require(keyPath)),
            projectId: 'lamigadorada-65048'
        });
    }
}

const db = admin.firestore();
module.exports = { db };