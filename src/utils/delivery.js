// Valida los datos de entrega de un pedido. Devuelve { error } o { value }.
function validateDelivery(body) {
    const { address, phone, deliveryDate, deliveryTime, notes } = body || {};

    const addr = String(address || '').trim();
    if (addr.length < 6 || addr.length > 200) {
        return { error: 'Ingresa una dirección de entrega válida.' };
    }

    const ph = String(phone || '').trim();
    if (!/^[0-9+()\-\s]{6,20}$/.test(ph) || ph.replace(/\D/g, '').length < 6) {
        return { error: 'Ingresa un teléfono de contacto válido.' };
    }

    const date = String(deliveryDate || '');
    const parsed = new Date(date + 'T00:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(parsed) || parsed.toISOString().slice(0, 10) !== date) {
        return { error: 'Elige una fecha de entrega válida.' };
    }
    // Se acepta desde "ayer" UTC para no rechazar a clientes con otra zona horaria.
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (date < yesterday) {
        return { error: 'La fecha de entrega no puede ser anterior a hoy.' };
    }

    const time = String(deliveryTime || '');
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
        return { error: 'Elige una hora de entrega válida.' };
    }
    const minutes = Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
    const isSunday = parsed.getUTCDay() === 0;
    const [open, close] = isSunday ? [9 * 60, 15 * 60] : [8 * 60, 20 * 60];
    if (minutes < open || minutes > close) {
        return {
            error: isSunday
                ? 'Los domingos entregamos de 9:00 a 15:00.'
                : 'De lunes a sábado entregamos de 8:00 a 20:00.'
        };
    }

    return {
        value: {
            address: addr,
            phone: ph,
            deliveryDate: date,
            deliveryTime: time,
            notes: String(notes || '').trim().slice(0, 300)
        }
    };
}

module.exports = { validateDelivery };
