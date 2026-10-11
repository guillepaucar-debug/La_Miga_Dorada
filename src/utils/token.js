const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

function makeToken(user) {
    return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(user) {
    return { id: user.id, name: user.name, email: user.email, avatar: user.avatar || null };
}

module.exports = { makeToken, publicUser };
