const { z } = require('zod');

const abrirSesionSchema = z.object({
    caja_id: z.number({ required_error: 'El ID de la caja es obligatorio', invalid_type_error: 'El ID de la caja debe ser númerico' }).int().positive(),
    monto_inicial: z.number({ required_error: 'El monto inicial es obligatorio', invalid_type_error: 'El monto inicial debe ser númerico' }).min(0, 'El monto inicial no puede ser negativo')
}).strict();

const cerrarSesionSchema = z.object({
    sesion_id: z.number({ required_error: 'El ID de la sesión es obligatorio', invalid_type_error: 'El ID de la sesión debe ser númerico' }).int().positive(),
    monto_cierre: z.number({ required_error: 'El monto de cierre es obligatorio', invalid_type_error: 'El monto de cierre debe ser númerico' }).min(0, 'El monto de cierre no puede ser negativo')
}).strict();

module.exports = {
    abrirSesionSchema,
    cerrarSesionSchema
};
