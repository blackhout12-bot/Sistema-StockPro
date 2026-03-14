const { z } = require('zod');

// Schema para la creación y edición de clientes
const clienteSchema = z.object({
    nombre: z.string().min(1, 'El nombre es obligatorio').max(255, 'El nombre no puede exceder 255 caracteres'),
    documento_identidad: z.string().min(1, 'El documento de identidad es obligatorio').max(100, 'El documento no puede exceder 100 caracteres'),
    email: z.string().email('Debe ser un email válido').max(255).optional().or(z.literal('')),
    telefono: z.string().max(50).optional().or(z.literal('')),
    direccion: z.string().max(255).optional().or(z.literal(''))
}).strict(); // Rechazar campos no mapeados

module.exports = {
    clienteSchema
};
