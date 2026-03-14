const { z } = require('zod');

const loginSchema = z.object({
    email: z.string({ required_error: 'El email es obligatorio' }).email('Formato de email inválido'),
    password: z.string({ required_error: 'La contraseña es obligatoria' }).min(1, 'La contraseña no puede estar vacía')
}).strict();

const registerSchema = z.object({
    empresaNombre: z.string({ required_error: 'El nombre de empresa es obligatorio' }).min(3, 'Mínimo 3 caracteres').max(255),
    nombre: z.string({ required_error: 'El nombre es obligatorio' }).min(2, 'Mínimo 2 caracteres').max(255),
    email: z.string({ required_error: 'El email es obligatorio' }).email('Email inválido').max(255),
    password: z.string({ required_error: 'La contraseña es obligatoria' }).min(6, 'Mínimo 6 caracteres'),
    plan: z.enum(['starter', 'pro', 'enterprise']).optional().default('starter')
}).strict();

const createUserSchema = z.object({
    nombre: z.string({ required_error: 'El nombre es obligatorio' }).min(2, 'Mínimo 2 caracteres'),
    email: z.string({ required_error: 'El email es obligatorio' }).email('Email inválido'),
    password: z.string({ required_error: 'La contraseña es obligatoria' }).min(6, 'Mínimo 6 caracteres'),
    rol: z.enum(['admin', 'vendedor'], { invalid_type_error: 'Rol inválido' })
}).strict();

module.exports = {
    loginSchema,
    registerSchema,
    createUserSchema
};
