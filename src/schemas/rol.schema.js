const { z } = require('zod');

// Valida un Record o Diccionario de arrays, ejemplo: { "ventas": ["leer", "crear"], "productos": ["*"] }
const permisosRecordSchema = z.record(
    z.string().min(1, 'La clave del recurso no puede estar vacía'),
    z.array(z.string()).min(1, 'Debe especificarse al menos una acción')
).optional();

const rolSchema = z.object({
    nombre: z.string({ required_error: 'El nombre del rol es obligatorio' }).min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
    codigo_rol: z.string({ required_error: 'El código de rol es obligatorio' }).min(2, 'El código debe tener al menos 2 caracteres').max(50),
    permisos: permisosRecordSchema,
    activo: z.boolean().optional().default(true)
}).strict(); // Previene JSON Pollution rechazando propiedades como 'es_sistema' o atributos inyectados

module.exports = {
    rolSchema
};
