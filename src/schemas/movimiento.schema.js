const { z } = require('zod');

// Schema para el registro de movimientos
const movimientoSchema = z.object({
    productoId: z.number({ required_error: 'El ID del producto es obligatorio', invalid_type_error: 'El ID de producto debe ser númerico' }).int().positive(),
    tipo: z.enum(['entrada', 'salida'], { required_error: 'El tipo de movimiento es obligatorio', invalid_type_error: 'El tipo debe ser "entrada" o "salida"' }),
    cantidad: z.number({ required_error: 'La cantidad es obligatoria', invalid_type_error: 'La cantidad debe ser numérica' }).int().positive('La cantidad debe ser mayor a 0'),
    deposito_id: z.number().int().positive().optional(),
    nro_lote: z.string().optional(),
    fecha_vto: z.string().optional()
}).strict(); // Rechazar campos no mapeados

module.exports = {
    movimientoSchema
};
