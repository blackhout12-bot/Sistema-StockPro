const { z } = require('zod');

const detalleFacturaSchema = z.object({
    producto_id: z.number({ required_error: 'El ID del producto es obligatorio' }).int().positive(),
    cantidad: z.number({ required_error: 'La cantidad es obligatoria' }).int().positive(),
    precio_unitario: z.number({ required_error: 'El precio unitario es obligatorio' }).min(0),
    subtotal: z.number({ required_error: 'El subtotal es obligatorio' }).min(0),
    deposito_id: z.number().int().positive().optional()
});

const facturacionSchema = z.object({
    cliente_id: z.number({ required_error: 'El cliente es obligatorio' }).int().positive('ID de cliente inválido'),
    total: z.number({ required_error: 'El total es obligatorio' }).min(0),
    detalles: z.array(detalleFacturaSchema).min(1, 'La factura debe contener al menos un producto'),
    tipo_comprobante: z.string().optional(), // ej: 'Factura A', 'Remito'
    metodo_pago: z.string().optional(),       // ej: 'Efectivo', 'Tarjeta'
    moneda_id: z.string().max(3).optional().default('ARS'),
    tipo_cambio: z.number().min(0).optional().default(1.0)
});

module.exports = {
    facturacionSchema
};
