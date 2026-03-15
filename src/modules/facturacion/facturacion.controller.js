const express = require('express');
const router = express.Router();
const facturacionService = require('./facturacion.service');
const mpService = require('../../utils/mercadopago.service');
const authenticate = require('../../middlewares/auth');
const logger = require('../../utils/logger');
const checkPermiso = require('../../middlewares/rbac');
const audit = require('../../middlewares/audit');
const { validateBody } = require('../../middlewares/validateRequest');
const { facturacionSchema } = require('../../schemas/facturacion.schema');

// Get all facturas
router.get('/', checkPermiso('facturacion', 'leer'), async (req, res, next) => {
    try {
        const facturas = await facturacionService.getAllFacturas(req.tenant_id);
        res.json(facturas);
    } catch (error) {
        next(error);
    }
});

// Get single factura with details
router.get('/:id', checkPermiso('facturacion', 'leer'), async (req, res, next) => {
    try {
        const factura = await facturacionService.getFacturaById(parseInt(req.params.id), req.tenant_id);
        if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });
        res.json(factura);
    } catch (error) {
        next(error);
    }
});

const { generateInvoicePDF } = require('../../utils/pdfGenerator');

// Generate PDF for a single factura (soporta GET y POST para descargas nativas)
router.all('/:id/pdf', checkPermiso('facturacion', 'leer'), async (req, res, next) => {
    try {
        const factura = await facturacionService.getFacturaById(parseInt(req.params.id), req.tenant_id);
        if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });

        const pdfBuffer = await generateInvoicePDF(factura);
        const buffer = Buffer.from(pdfBuffer);

        const safeFilename = `Factura_${factura.nro_factura.replace(/[^a-z0-9]/gi, '_')}.pdf`;

        const isInline = req.query.inline === 'true';
        const disposition = isInline ? 'inline' : 'attachment';
        const contentType = isInline ? 'application/pdf' : 'application/octet-stream';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Content-Disposition', `${disposition}; filename="${safeFilename}"`);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length');
        res.send(buffer);
    } catch (error) {
        next(error);
    }
});

// Registrar nueva factura (Venta)
router.post('/', checkPermiso('facturacion', 'emitir'), validateBody(facturacionSchema), audit('emitir', 'Facturacion'), async (req, res, next) => {
    try {
        logger.info({ userId: req.user.id, empresa_id: req.tenant_id }, '[POST /facturacion] Iniciando creación de factura');

        if (!req.tenant_id) {
            return res.status(400).json({ error: 'Falta contexto de empresa (empresa_id) para generar la venta.' });
        }

        const { clienteId, items, metodoPago, sucursal, total, subtotal, impuestos, descuento, observaciones } = req.body;
        const cleanBody = { cliente_id: clienteId, items, metodo_pago: metodoPago, sucursal, total, subtotal, impuestos, descuento, observaciones };

        const newFactura = await facturacionService.createFactura(cleanBody, req.user.id, req.tenant_id);
        res.locals.insertedId = newFactura.id;
        res.status(201).json(newFactura);
    } catch (error) {
        logger.error({ 
            userId: req.user.id, 
            empresa_id: req.tenant_id, 
            error: error.message, 
            stack: error.stack,
            body: req.body 
        }, '[POST /facturacion] Error al crear factura');
        next(error);
    }
});

// --- MercadoPago Integrations ---

// Generar QR para cobrar
router.post('/mercadopago/qr', checkPermiso('facturacion', 'emitir'), async (req, res, next) => {
    try {
        const { total, external_reference, title } = req.body;
        const qr = await mpService.generarQR({
            amount: total,
            external_reference: external_reference || `REF-${Date.now()}`,
            title: title || 'Cobro POS',
            empresa_id: req.tenant_id
        });
        res.json(qr);
    } catch (error) {
        next(error);
    }
});

// Verificar estado de pago
router.get('/mercadopago/status/:ref', checkPermiso('facturacion', 'leer'), async (req, res, next) => {
    try {
        const status = await mpService.verificarPago(req.params.ref);
        res.json(status);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
