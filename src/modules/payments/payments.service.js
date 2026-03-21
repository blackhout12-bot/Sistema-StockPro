// src/modules/payments/payments.service.js
const { sql, connectDB } = require('../../config/db');
const logger = require('../../utils/logger');
const Stripe = require('stripe');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const stripe = process.env.STRIPE_KEY ? new Stripe(process.env.STRIPE_KEY) : null;
const mpClient = process.env.MP_ACCESS_TOKEN ? new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN }) : null;

async function initPayment({ monto, moneda = 'ARS', metodo, usuario_id, empresa_id }) {
    const pool = await connectDB();
    
    // 1. Registrar intención de pago en DB
    const res = await pool.request()
        .input('uid', sql.Int, usuario_id)
        .input('eid', sql.Int, empresa_id)
        .input('monto', sql.Decimal(18, 2), monto)
        .input('moneda', sql.VarChar(10), moneda)
        .input('metodo', sql.VarChar(50), metodo)
        .input('estado', sql.VarChar(50), 'pending')
        .query(`
            INSERT INTO Pagos (usuario_id, empresa_id, monto, moneda, estado, metodo_pago)
            OUTPUT INSERTED.id
            VALUES (@uid, @eid, @monto, @moneda, @estado, @metodo)
        `);
    
    const pagoId = res.recordset[0].id;

    let initUrl = '';
    let externalRef = '';

    if (metodo === 'stripe') {
        if (!stripe) throw new Error('Stripe no configurado');
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: moneda.toLowerCase(),
                    product_data: { name: 'Suscripción/Crédito StockPro' },
                    unit_amount: Math.round(monto * 100),
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/pagos/success?id=${pagoId}`,
            cancel_url: `${process.env.FRONTEND_URL}/pagos/cancel?id=${pagoId}`,
            client_reference_id: pagoId.toString(),
        });
        initUrl = session.url;
        externalRef = session.id;
    } else if (metodo === 'mercadopago') {
        if (!mpClient) throw new Error('MercadoPago no configurado');
        const preference = new Preference(mpClient);
        const result = await preference.create({
            body: {
                items: [{
                    title: 'Crédito StockPro',
                    quantity: 1,
                    unit_price: Number(monto),
                    currency_id: moneda
                }],
                external_reference: pagoId.toString(),
                back_urls: {
                    success: `${process.env.FRONTEND_URL}/pagos/success`,
                    failure: `${process.env.FRONTEND_URL}/pagos/error`,
                    pending: `${process.env.FRONTEND_URL}/pagos/pending`
                },
                notification_url: `${process.env.BACKEND_URL}/api/v1/payments/callback/mercadopago`
            }
        });
        initUrl = result.init_point;
        externalRef = result.id;
    } else {
        throw new Error('Método de pago no soportado');
    }

    // 2. Actualizar referencia externa
    await pool.request()
        .input('id', sql.Int, pagoId)
        .input('ref', sql.VarChar(255), externalRef)
        .query('UPDATE Pagos SET referencia_externa = @ref WHERE id = @id');

    return { pagoId, initUrl };
}

async function handleWebhookStripe(sig, body) {
    if (!stripe) return;
    let event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        throw new Error(`Webhook Error: ${err.message}`);
    }

    const session = event.data.object;
    const pagoId = session.client_reference_id;

    if (event.type === 'checkout.session.completed') {
        await updatePagoEstado(pagoId, 'approved');
    } else if (event.type === 'checkout.session.expired') {
        await updatePagoEstado(pagoId, 'rejected');
    }
}

async function handleWebhookMP(data) {
    // MercadoPago envía notificación, hay que consultar el estado
    if (data.type === 'payment') {
        // Aquí se consultaría el payment ID de MP y se actualizaría nuestra DB
        logger.info({ mp_data: data }, 'MP Webhook recibido (Payment)');
        // Implementación simplificada: actualizar por external_reference si viene en la query
    }
}

const { deleteCache } = require('../../config/redis');

async function updatePagoEstado(id, estado) {
    const pool = await connectDB();
    const result = await pool.request()
        .input('id', sql.Int, id)
        .input('estado', sql.VarChar(50), estado)
        .query('UPDATE Pagos SET estado = @estado, fecha_actualizacion = GETDATE() OUTPUT INSERTED.empresa_id WHERE id = @id');
    
    if (result.recordset.length > 0) {
        const empresa_id = result.recordset[0].empresa_id;
        await deleteCache(`stats:tenant_${empresa_id}`);
    }
    
    logger.info({ pagoId: id, estado }, 'Estado de pago actualizado y caché invalidada');
}

async function getRecentPayments(empresa_id) {
    const pool = await connectDB();
    const res = await pool.request()
        .input('eid', sql.Int, empresa_id)
        .query('SELECT TOP 10 * FROM Pagos WHERE empresa_id = @eid ORDER BY fecha_creacion DESC');
    return res.recordset;
}

async function getPaymentStats(empresa_id) {
    const pool = await connectDB();
    const res = await pool.request()
        .input('eid', sql.Int, empresa_id)
        .query(`
            SELECT 
                COUNT(CASE WHEN estado = 'approved' THEN 1 END) as approved,
                COUNT(CASE WHEN estado = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN estado = 'rejected' THEN 1 END) as rejected
            FROM Pagos WHERE empresa_id = @eid
        `);
    return res.recordset[0];
}

module.exports = {
    initPayment,
    handleWebhookStripe,
    handleWebhookMP,
    updatePagoEstado,
    getRecentPayments,
    getPaymentStats
};
