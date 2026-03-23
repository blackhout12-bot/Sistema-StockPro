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
    rol: z.string({ required_error: 'El rol es obligatorio' }).min(2, 'Mínimo 2 caracteres para el rol') // Decoupled from ENUM to support dynamic roles
}).strict();

const forgotPasswordSchema = z.object({
    email: z.string({ required_error: 'El email es obligatorio' }).email('Email inválido')
}).strict();

const resetPasswordSchema = z.object({
    token: z.string({ required_error: 'El token es obligatorio' }),
    nuevaPassword: z.string({ required_error: 'La contraseña es obligatoria' }).min(8, 'Mínimo 8 caracteres para la contraseña segura')
}).strict();

const updateRoleSchema = z.object({
    rol: z.string({ required_error: 'El código de rol es obligatorio' }).min(2, 'Rol inválido')
}).strict();

const selectEmpresaSchema = z.object({
    usuario_id: z.number({ required_error: 'El ID de usuario es obligatorio' }).int().positive(),
    empresa_id: z.number({ required_error: 'El ID de empresa es obligatorio' }).int().positive()
}).strict();

module.exports = {
    loginSchema,
    registerSchema,
    createUserSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    updateRoleSchema,
    selectEmpresaSchema
};
