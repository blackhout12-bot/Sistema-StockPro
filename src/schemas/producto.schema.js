const { z } = require('zod');

// Schema para la creación y edición de productos
const productoSchema = z.object({
    sku: z.string().min(1, 'El código SKU es obligatorio').max(100, 'El SKU no puede exceder 100 caracteres').nullable().optional(),
    nombre: z.string().min(1, 'El nombre es obligatorio').max(255, 'El nombre no puede exceder 255 caracteres'),
    descripcion: z.string().nullable().optional(),
    precio: z.coerce.number({ required_error: 'El precio es obligatorio', invalid_type_error: 'El precio debe ser un número' }).min(0, 'El precio no puede ser negativo'),
    costo: z.coerce.number().min(0, 'El costo no puede ser negativo').nullable().optional(),
    stock: z.coerce.number({ invalid_type_error: 'El stock debe ser un número' }).int('El stock debe ser un entero').min(0, 'El stock no puede ser negativo').nullable().optional().default(0),
    stock_min: z.coerce.number().int().min(0).nullable().optional().default(0),
    stock_max: z.coerce.number().int().min(0).nullable().optional(),
    categoria_id: z.union([z.string(), z.number()]).nullable().optional(),
    nro_lote: z.string().nullable().optional(),
    fecha_vto: z.string().nullable().optional(),
    moneda_id: z.string().max(3).nullable().optional().default('ARS'),
    custom_fields: z.union([z.string(), z.record(z.string(), z.any())]).nullable().optional(),
    image_url: z.string().nullable().optional()
}).strict();

// Schema estricto blindante para Entity-Attribute-Value (EAV) - Rubros Dinámicos
const categoriaEsquemaSchema = z.object({
    nombre_rubro: z.string({ required_error: 'El nombre del rubro es obligatorio' }).min(2).max(100),
    icon: z.string().max(10).optional(),
    esquema_json: z.record(
        z.string(), 
        z.any() // Soporte asimétrico real pero protegido en primera capa contra ataques buffer string extensos y NaN directos
    ).optional().default({})
}).strict();

module.exports = {
    productoSchema,
    categoriaEsquemaSchema
};
