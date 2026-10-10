const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { ROOT_DIR } = require('../config');

// Credenciales de Firebase, en este orden:
// 1) FIREBASE_SERVICE_ACCOUNT: el JSON de la cuenta de servicio (texto JSON o en base64). Ideal para Render.
// 2) firebase-service-account.json en la raíz del proyecto. Ideal para local.
// 3) FIRESTORE_EMULATOR_HOST: emulador local de Firestore (no necesita credenciales).
// 4) GOOGLE_APPLICATION_CREDENTIALS / credenciales por defecto de Google Cloud.
function loadServiceAccount() {
    let raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (raw) {
        raw = raw.trim();
        if (!raw.startsWith('{')) raw = Buffer.from(raw, 'base64').toString('utf8');
    } else {
        const file = path.join(ROOT_DIR, 'firebase-service-account.json');
        if (fs.existsSync(file)) raw = fs.readFileSync(file, 'utf8');
    }
    if (!raw) return null;

    let account;
    try {
        account = JSON.parse(raw);
    } catch (_) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT no es un JSON válido. Pega el contenido completo del archivo descargado desde Firebase.');
    }
    // Algunos paneles de hosting guardan los saltos de línea de la clave como "\\n" literales.
    if (typeof account.private_key === 'string') account.private_key = account.private_key.replace(/\\n/g, '\n');
    return account;
}

if (!admin.apps.length) {
    const account = loadServiceAccount();
    if (account) {
        admin.initializeApp({ credential: admin.credential.cert(account) });
    } else if (process.env.FIRESTORE_EMULATOR_HOST) {
        admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'la-miga-dorada-local' });
    } else {
        admin.initializeApp({ credential: admin.credential.applicationDefault() });
    }
}

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

module.exports = { admin, db };
