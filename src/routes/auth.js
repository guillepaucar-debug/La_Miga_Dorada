const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../database/connection');
const auth = require('../middleware/auth');
const { makeToken, publicUser } = require('../utils/token');

const router = express.Router();

const users = () => db.collection('users');
// Un documento por correo garantiza que no se repita, incluso con dos registros simultáneos.
const emailRef = email => db.collection('emails').doc(encodeURIComponent(email));

async function findUserByEmail(email) {
    const link = await emailRef(email).get();
    if (!link.exists) return null;
    const snap = await users().doc(link.data().userId).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

async function findUserById(id) {
    const snap = await users().doc(String(id)).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

// Registro
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Completa todos los campos.' });
    }
    if (String(password).length < 6) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    try {
        const normalizedEmail = String(email).trim().toLowerCase();
        const passwordHash = await bcrypt.hash(String(password), 12);
        const userRef = users().doc();
        const now = new Date().toISOString();
        const data = {
            name: String(name).trim(),
            email: normalizedEmail,
            passwordHash,
            avatar: null,
            createdAt: now,
            updatedAt: now
        };

        const taken = await db.runTransaction(async t => {
            const link = await t.get(emailRef(normalizedEmail));
            if (link.exists) return true;
            t.set(emailRef(normalizedEmail), { userId: userRef.id });
            t.set(userRef, data);
            return false;
        });
        if (taken) return res.status(409).json({ message: 'Este correo electrónico ya está registrado.' });

        const user = { id: userRef.id, ...data };
        res.status(201).json({ token: makeToken(user), user: publicUser(user) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'No se pudo crear la cuenta.' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Ingresa correo y contraseña.' });

    try {
        const user = await findUserByEmail(String(email).trim().toLowerCase());
        if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
            return res.status(401).json({ message: 'Correo o contraseña incorrectos.' });
        }

        res.json({ token: makeToken(user), user: publicUser(user) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'No se pudo iniciar sesión.' });
    }
});

// Perfil actual
router.get('/me', auth, async (req, res) => {
    try {
        const user = await findUserById(req.user.id);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
        res.json({ user: publicUser(user) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'No se pudo cargar el perfil.' });
    }
});

// Actualizar perfil
router.put('/profile', auth, async (req, res) => {
    const { name, avatar } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ message: 'El nombre no puede estar vacío.' });

    try {
        const ref = users().doc(String(req.user.id));
        if (!(await ref.get()).exists) return res.status(404).json({ message: 'Usuario no encontrado.' });

        await ref.update({
            name: String(name).trim(),
            avatar: avatar || null,
            updatedAt: new Date().toISOString()
        });
        const user = await findUserById(req.user.id);
        res.json({ user: publicUser(user) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'No se pudo actualizar el perfil.' });
    }
});

// Reset simple para el proyecto
router.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body || {};
    if (!email || !newPassword) return res.status(400).json({ message: 'Completa los campos.' });
    if (String(newPassword).length < 6) return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });

    try {
        const user = await findUserByEmail(String(email).trim().toLowerCase());
        if (!user) return res.status(404).json({ message: 'No encontramos ninguna cuenta registrada con este correo.' });

        const hash = await bcrypt.hash(String(newPassword), 12);
        await users().doc(user.id).update({ passwordHash: hash, updatedAt: new Date().toISOString() });
        res.json({ message: 'Contraseña actualizada.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'No se pudo actualizar la contraseña.' });
    }
});

router.post('/logout', auth, (req, res) => {
    // JWT stateless: el navegador elimina el token.
    res.json({ message: 'Sesión cerrada.' });
});

module.exports = router;
