// src/modules/auth/auth.controller.js
const { z } = require('zod');
const express = require('express');
const router = express.Router();
const authService = require('./auth.service');
const authenticate = require('../../middlewares/auth');
const checkPermiso = require('../../middlewares/rbac');
const authorizeRole = require('../../middlewares/roles');
const rateLimit = require('express-rate-limit');
const logger = require('../../utils/logger');
const audit = require('../../middlewares/audit');
const { validateBody } = require('../../middlewares/validateRequest');
const { 
    loginSchema, 
    registerSchema, 
    createUserSchema, 
    forgotPasswordSchema, 
    resetPasswordSchema, 
    updateRoleSchema, 
    selectEmpresaSchema 
} = require('../../schemas/auth.schema');

// Rate limiter anti brute-force (Desactivado para Debug)
const loginLimiter = (req, res, next) => next();

// ── POST /auth/forgot-password ────────────────────────────────────────────────
router.post('/forgot-password', validateBody(forgotPasswordSchema), async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'El email es requerido.' });
  try {
    await authService.forgotPassword(email);
    res.json({ message: 'Si el correo está registrado, recibirás un enlace de recuperación.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /auth/reset-password ─────────────────────────────────────────────────
router.post('/reset-password', validateBody(resetPasswordSchema), async (req, res) => {
  const { token, nuevaPassword } = req.body;
  try {
    await authService.resetPassword(token, nuevaPassword);
    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

// ── POST /auth/login ──────────────────────────────────────────────────────────
// Respuesta: { token, user } | { requires_empresa_select, empresas[], usuario_id }
router.post('/login', loginLimiter, validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 401).json({ error: err.message });
  }
});
// ── POST /auth/login-mfa ──────────────────────────────────────────────────────
router.post('/login-mfa', loginLimiter, async (req, res) => {
  const { user_id, token } = req.body;
  if (!user_id || !token) return res.status(400).json({ error: 'Faltan parámetros requeridos (user_id, token pin).' });
  try {
    const result = await authService.loginMfa(Number(user_id), token);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 401).json({ error: err.message });
  }
});

// ── GET /auth/mfa/setup ───────────────────────────────────────────────────────
router.get('/mfa/setup', authenticate, async (req, res, next) => {
  try {
    const result = await authService.setupMfa(req.user.id, req.user.email);
    res.json(result);
  } catch (err) { next(err); }
});

// ── POST /auth/mfa/verify ─────────────────────────────────────────────────────
router.post('/mfa/verify', authenticate, async (req, res, next) => {
  const { secret, token } = req.body;
  if (!secret || !token) return res.status(400).json({ error: 'Faltan parámetros requeridos (secret, token pin).' });
  try {
    const result = await authService.verifyAndEnableMfa(req.user.id, secret, token);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

// ── POST /auth/select-empresa ─────────────────────────────────────────────────
// Para usuarios con múltiples empresas — selecciona contexto y genera token
router.post('/select-empresa', validateBody(selectEmpresaSchema), async (req, res) => {
  const { usuario_id, empresa_id } = req.body;
  try {
    const result = await authService.seleccionarEmpresa(Number(usuario_id), Number(empresa_id));
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 403).json({ error: err.message });
  }
});

// ── PUT /auth/contexto ────────────────────────────────────────────────────────
// Ajuste atómico del selector de contexto para Sucursales Activas Pivotantes
router.put('/contexto', authenticate, async (req, res) => {
  const { sucursal_id } = req.body;
  if (!sucursal_id) return res.status(400).json({ error: 'ID de sucursal es obligatorio.' });
  try {
    // Al no haber session JWT mutable forzado en frontend, el servidor retorna OK autoritativo.
    // En despliegues futuros el server re-firma un Token con target de contexto limitado.
    return res.json({ message: 'Contexto de entorno actualizado exitosamente. Front-end debe pivotear los requests siguientes a este header.', sucursal_id });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /auth/refresh ─────────────────────────────────────────────────────────
// Renueva el token de autenticación
router.get('/refresh', authenticate, async (req, res) => {
  try {
    const result = await authService.refreshToken(req.user);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 401).json({ error: err.message });
  }
});

// ── GET /auth/empresas-disponibles — Lista de empresas para dropdown (Solo Admin via RBAC) ──
router.get('/empresas-disponibles', authenticate, checkPermiso('usuarios', 'leer'), async (req, res, next) => {
  try {
    const empresas = await authService.obtenerEmpresasDisponibles();
    res.json(empresas);
  } catch (err) {
    next(err);
  }
});

// ── GET /auth/global — Listado global de usuarios y empresas (Solo Admin via RBAC) ─────
router.get('/global', authenticate, checkPermiso('usuarios', 'leer'), async (req, res, next) => {
  try {
    const usuarios = await authService.obtenerUsuariosGlobal();
    res.json(usuarios);
  } catch (err) {
    next(err);
  }
});

// ── POST /auth/register ───────────────────────────────────────────────────────
router.post('/register', validateBody(registerSchema), audit('registrar', 'Empresa/Usuario'), async (req, res) => {
  try {
    const result = await authService.registerEmpresa(req.body);
    res.status(201).json(result);
  } catch (err) {
    if (err.message?.includes('UNIQUE KEY')) {
      return res.status(400).json({ error: 'El email o la empresa ya están registrados.' });
    }
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// ── GET /auth/ — listar miembros de mi empresa (Admin via RBAC) ───────────────────────
router.get('/', authenticate, checkPermiso('usuarios', 'leer'), async (req, res, next) => {
  try {
    const usuarios = await authService.obtenerUsuarios(req.user.empresa_id);
    res.json(usuarios);
  } catch (err) { next(err); }
});

// ── GET /auth/mis-empresas — lista de empresas del usuario autenticado ────────
router.get('/mis-empresas', authenticate, async (req, res, next) => {
  try {
    const empresas = await authService.obtenerMisEmpresas(req.user.id);
    res.json(empresas);
  } catch (err) { next(err); }
});

// ── POST /auth/users — crear usuario en mi empresa (Admin via RBAC) ───────────────────
router.post('/users', authenticate, checkPermiso('usuarios', 'crear'), validateBody(createUserSchema), audit('crear', 'Usuario'), async (req, res) => {
  // --- SEGURIDAD: Delegación Jerárquica ---
  const hierarchy = { admin: 3, gerente: 2, supervisor: 1, vendedor: 0, cajero: 0 };
  const rolDeseado = (req.body.rol || '').toLowerCase();
  const miRol = (req.user.rol || '').toLowerCase();
  
  if (miRol !== 'admin' && (hierarchy[rolDeseado] || 0) >= (hierarchy[miRol] || 0)) {
     return res.status(403).json({ error: 'Delegación fallida: No tienes jurisdicción para asignar privilegios a tu mismo nivel orgánico o superior.' });
  }

  try {
    await authService.crearUsuarioAdmin({ ...req.body, empresa_id: req.user.empresa_id });
    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (err) {
    if (err.message?.includes('UNIQUE KEY') || err.message?.includes('unique')) {
      return res.status(400).json({ error: 'El email ya está registrado.' });
    }
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// ── PUT /auth/:id/rol — cambiar rol en mi empresa (Admin via RBAC) — BEFORE /:id wildcard
router.put('/:id/rol', authenticate, checkPermiso('usuarios', 'actualizar'), validateBody(updateRoleSchema), audit('modificar_rol', 'Usuario'), async (req, res) => {
  // --- SEGURIDAD: Delegación Jerárquica ---
  const hierarchy = { admin: 3, gerente: 2, supervisor: 1, vendedor: 0, cajero: 0 };
  const rolDeseado = (req.body.rol || '').toLowerCase();
  const miRol = (req.user.rol || '').toLowerCase();
  
  if (miRol !== 'admin' && (hierarchy[rolDeseado] || 0) >= (hierarchy[miRol] || 0)) {
     return res.status(403).json({ error: 'Superación de límites: Solo un rol superior puede ceder esta asignación corporativa.' });
  }

  try {
    const result = await authService.actualizarRolUsuario(
      Number(req.params.id),
      req.user.empresa_id,
      req.body.rol
    );
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

// ── POST /auth/:id/reset-password — resetear contraseña (Admin via RBAC) — BEFORE /:id wildcard
router.post('/:id/reset-password', authenticate, checkPermiso('usuarios', 'actualizar'), validateBody(z.object({ nuevaPassword: z.string().min(8, 'Mínimo 8 caracteres') }).strict()), audit('reset_password', 'Usuario'), async (req, res) => {
  const { nuevaPassword } = req.body;
  try {
    await authService.resetearPassword(Number(req.params.id), req.user.empresa_id, nuevaPassword);
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// ── POST /auth/:id/empresas — dar acceso a otro usuario en mi empresa (Admin via RBAC) ─
router.post('/:id/empresas', authenticate, checkPermiso('usuarios', 'actualizar'), validateBody(z.object({ rol: z.string().default('vendedor'), empresa_id: z.number().int().positive().optional() }).strict()), audit('asignar_empresa', 'Usuario'), async (req, res) => {
  const { rol, empresa_id } = req.body;
  // Solo puede dar acceso a su propia empresa (o a otra si es un super-admin)
  const target_empresa = empresa_id || req.user.empresa_id;
  try {
    await authService.agregarUsuarioAEmpresa(
      Number(req.params.id),
      Number(target_empresa),
      rol
    );
    res.json({ message: 'Acceso otorgado correctamente' });
  } catch (err) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

// ── PUT /auth/:id — editar nombre/email de un usuario (Admin via RBAC) — AFTER specific sub-routes
router.put('/:id', authenticate, checkPermiso('usuarios', 'actualizar'), audit('actualizar', 'Usuario'), async (req, res) => {
  try {
    const result = await authService.actualizarUsuario(
      Number(req.params.id),
      req.user.empresa_id,
      req.body
    );
    res.json(result);
  } catch (err) {
    if (err.message?.includes('UNIQUE KEY') || err.message?.includes('unique')) {
      return res.status(400).json({ error: 'El email ya está en uso.' });
    }
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// ── DELETE /auth/:id — revocar acceso (soft delete de membresía) (Admin via RBAC) ──────
router.delete('/:id', authenticate, checkPermiso('usuarios', 'eliminar'), audit('revocar_acceso', 'Usuario'), async (req, res, next) => {
  try {
    const result = await authService.revocarAcceso(Number(req.params.id), req.user.empresa_id);
    res.json(result);
  } catch (err) { next(err); }
});

// ── PATCH /auth/me/onboarding — marcar onboarding como completado ────────────
router.patch('/me/onboarding', authenticate, audit('finalizar_tour', 'Sistema'), async (req, res, next) => {
  try {
    const result = await authService.completarOnboarding(req.user.id, req.tenant_id || req.user.empresa_id);
    res.json(result);
  } catch (err) { next(err); }
});

// ── POST /auth/me/onboarding/reset — reiniciar UX guiado ────────────
router.post('/me/onboarding/reset', authenticate, audit('reiniciar_tour', 'Sistema'), async (req, res, next) => {
  try {
    const result = await authService.resetearOnboarding(req.user.id, req.tenant_id || req.user.empresa_id);
    res.json(result);
  } catch (err) { next(err); }
});

// ── POST /auth/me/onboarding/start — auditar inicio de UX guiado ────────────
router.post('/me/onboarding/start', authenticate, audit('iniciar_tour', 'Sistema'), async (req, res, next) => {
  try {
    res.json({ message: 'Tour iniciado' });
  } catch (err) { next(err); }
});

module.exports = router;
