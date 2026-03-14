const { z } = require('zod');

// Schema para la creación y edición de productos
const productoSchema = z.object({
    sku: z.string().min(1, 'El código SKU es obligatorio').max(100, 'El SKU no puede exceder 100 caracteres').optional(),
    nombre: z.string().min(1, 'El nombre es obligatorio').max(255, 'El nombre no puede exceder 255 caracteres'),
    descripcion: z.string().optional(),
    precio: z.number({ required_error: 'El precio es obligatorio', invalid_type_error: 'El precio debe ser un número' }).min(0, 'El precio no puede ser negativo'),
    costo: z.number().min(0, 'El costo no puede ser negativo').optional(),
    stock: z.number({ invalid_type_error: 'El stock debe ser un número' }).int('El stock debe ser un entero').min(0, 'El stock no puede ser negativo').optional().default(0),
    stock_min: z.number().int().min(0).optional().default(0),
    stock_max: z.number().int().min(0).optional(),
    categoria: z.string().max(100).optional(),
    moneda_id: z.string().max(3).optional().default('ARS')
}).strict();

module.exports = {
    productoSchema
};
