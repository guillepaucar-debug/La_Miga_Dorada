const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

if (!admin.apps.length) {
    // Cloud Run: utiliza las credenciales de la cuenta de servicio.
    if (process.env.K_SERVICE) {
        admin.initializeApp({
            projectId: 'lamigadorada-65048'
        });
    } else {
        // Desarrollo local: utiliza la clave JSON existente.
        const keyPath = path.resolve(
            __dirname,
            '../../firebase-key.json'
        );

        if (!fs.existsSync(keyPath)) {
            throw new Error(
                `No se encontró el archivo: ${keyPath}`
            );
        }

        const serviceAccount = require(keyPath);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: 'lamigadorada-65048'
        });
    }
}

const db = admin.firestore();

module.exports = { db };