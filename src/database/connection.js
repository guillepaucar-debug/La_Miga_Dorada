const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

function loadServiceAccount() {
    // 1) Variable de entorno con el JSON completo
    const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
    if (raw.startsWith('{')) return JSON.parse(raw);
    if (raw) {
        console.warn('AVISO: FIREBASE_SERVICE_ACCOUNT no contiene un JSON (debe empezar con "{"). Se intentará leer el archivo.');
    }

    // 2) Archivo: Secret File de Render o archivo local
    const candidates = [
        '/etc/secrets/firebase-key.json',
        path.resolve(__dirname, '../../firebase-key.json')
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
    return null;
}

if (!admin.apps.length) {
    const serviceAccount = loadServiceAccount();

    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: 'lamigadorada-65048'
        });
    } else if (process.env.K_SERVICE) {
        // Cloud Run
        admin.initializeApp({ projectId: 'lamigadorada-65048' });
    } else {
        throw new Error('No se encontró la llave de Firebase (variable FIREBASE_SERVICE_ACCOUNT o archivo firebase-key.json).');
    }
}

const db = admin.firestore();

module.exports = { db };