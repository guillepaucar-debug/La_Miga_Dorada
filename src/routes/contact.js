const express = require('express');
const jwt = require('jsonwebtoken');
const { db } = require('../database/connection');
const { JWT_SECRET } = require('../config');

const router = express.Router();

// Deben coincidir con las opciones del desplegable "Asunto" de contacto.html.
const SUBJECTS = ['Consulta general', 'Pedido', 'Pedido personalizado', 'Sugerencia', 'Reclamo', 'Otro'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Límite sencillo contra spam: máximo 5 mensajes por IP cada 10 minutos (se guarda en memoria).
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map();

function isRateLimited(ip) {
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
    if (recent.length >= MAX_PER_WINDOW) {
        hits.set(ip, recent);
        return true;
    }
    recent.push(now);
    hits.set(ip, recent);
    return false;
}

setInterval(() => {
    const now = Date.now();
    for (const [ip, times] of hits) {
        const recent = times.filter(t => now - t < WINDOW_MS);
        if (recent.length) hits.set(ip, recent);
        else hits.delete(ip);
    }
}, WINDOW_MS).unref();

// Si quien escribe tiene sesión iniciada se anota su id; si no, el mensaje se guarda igual (anónimo).
function optionalUserId(req) {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return null;
    try {
        const payload = jwt.verify(header.slice(7), JWT_SECRET);
        return payload && payload.id != null ? String(payload.id) : null;
    } catch (_) {
        return null;
    }
}

// Mensajes del formulario de contacto
router.post('/', async (req, res) => {
    const { name, email, subject, message, website } = req.body || {};

    // Campo trampa: las personas lo dejan vacío; los bots suelen rellenarlo. Se responde "ok" sin guardar nada.
    if (website) return res.status(201).json({ message: 'Mensaje enviado.' });

    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanSubject = String(subject || '').trim();
    const cleanMessage = String(message || '').trim();

    if (cleanName.length < 2) return res.status(400).json({ message: 'Ingresa tu nombre.' });
    if (cleanName.length > 80) return res.status(400).json({ message: 'El nombre es demasiado largo (máximo 80 caracteres).' });
    if (!EMAIL_RE.test(cleanEmail) || cleanEmail.length > 120) {
        return res.status(400).json({ message: 'Ingresa un correo electrónico válido.' });
    }
    if (!SUBJECTS.includes(cleanSubject)) return res.status(400).json({ message: 'Elige un asunto.' });
    if (cleanMessage.length < 10) return res.status(400).json({ message: 'Escribe tu mensaje (mínimo 10 caracteres).' });
    if (cleanMessage.length > 1000) return res.status(400).json({ message: 'El mensaje es demasiado largo (máximo 1000 caracteres).' });

    if (isRateLimited(req.ip || (req.socket && req.socket.remoteAddress) || 'desconocida')) {
        return res.status(429).json({ message: 'Has enviado varios mensajes seguidos. Inténtalo de nuevo en unos minutos.' });
    }

    try {
        await db.collection('contact_messages').add({
            name: cleanName,
            email: cleanEmail,
            subject: cleanSubject,
            message: cleanMessage,
            userId: optionalUserId(req),
            status: 'nuevo',
            createdAt: new Date().toISOString()
        });
        res.status(201).json({ message: 'Mensaje enviado.' });
    } catch (error) {
        console.error('Error al guardar el mensaje de contacto:', error);
        res.status(500).json({ message: 'No se pudo enviar el mensaje. Inténtalo de nuevo.' });
    }
});

module.exports = router;
