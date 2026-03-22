// src/modules/auth/auth.service.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const authRepository = require('../../repositories/auth.repository');
const { sql, connectDB } = require('../../config/db');
const logger = require('../../utils/logger');

const ROLES_PERMITIDOS = ['admin', 'vendedor'];
const JWT_EXPIRY = '8h';

// ─── Helpers ────────────────────────────────────────────────────────────────

function generarToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

function buildTokenPayload(usuario, empresa_id, rol) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    empresa_id,
    rol,
  };
}

// ─── Auth ────────────────────────────────────────────────────────────────────

/**
 * Login multi-empresa.
 * Si el usuario tiene acceso a 1 empresa → devuelve token directo.
 * Si tiene N empresas → devuelve { requires_empresa_select: true, empresas[], usuario_id }
 */
async function login(email, password) {
  const usuario = await authRepository.obtenerUsuarioPorEmail(email);
  if (!usuario) {
    logger.warn({ email }, 'Login fallido: usuario no encontrado');
    throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
  }

  const valido = await bcrypt.compare(password, usuario.password_hash);
  if (!valido) {
    logger.warn({ email }, 'Login fallido: contraseña incorrecta');
    throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
  }

  // Buscar membresías activas.
  let membresias = [];
  try {
    membresias = await authRepository.obtenerMembresiasPorUsuario(usuario.id);
  } catch (e) {
    logger.error('Error al obtener membresias', e);
  }

  // Si no hay membresías en la tabla relacional, usamos el fallback clásico (empleado normal)
  if (!membresias || membresias.length === 0) {
    if (usuario.empresa_id) {
      // Obtener nombre real de empresa si es posible
      const pool = await connectDB();
      let empNom = 'Principal';
      try {
        const eRes = await pool.request().input('eid', sql.Int, usuario.empresa_id).query('SELECT nombre FROM Empresa WHERE id = @eid');
        if (eRes.recordset[0]) empNom = eRes.recordset[0].nombre;
      } catch (ex) { }
      membresias = [{ empresa_id: usuario.empresa_id, rol: usuario.rol, empresa_nombre: empNom }];
    }
  }

  if (membresias.length === 0) {
    throw Object.assign(new Error('Este usuario no tiene acceso a ninguna empresa activa'), { statusCode: 403 });
  }

  // Una sola empresa → token directo
  if (membresias.length === 1) {
    const { empresa_id, rol } = membresias[0];
    const token = generarToken(buildTokenPayload(usuario, empresa_id, rol));
    logger.info({ userId: usuario.id, empresa_id, rol }, 'Login exitoso (empresa única)');
    return {
      token,
      user: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, empresa_id, rol },
    };
  }

  // Múltiples empresas → pedir selección
  logger.info({ userId: usuario.id, num_empresas: membresias.length }, 'Login multi-empresa: requiere selección');
  return {
    requires_empresa_select: true,
    usuario_id: usuario.id,
    empresas: membresias.map(m => ({
      empresa_id: m.empresa_id,
      empresa_nombre: m.empresa_nombre,
      rol: m.rol,
      logo_url: m.logo_url || null,
    })),
  };
}

/**
 * Genera JWT para un usuario + empresa específica.
 * Valida que el usuario tenga membresia activa en esa empresa.
 */
async function seleccionarEmpresa(usuario_id, empresa_id) {
  const pool = await connectDB();

  // Corregido: Await en la promesa de BD
  const uRes = await pool.request()
    .input('uid', sql.Int, usuario_id)
    .query('SELECT id, nombre, email, empresa_id, rol FROM Usuarios WHERE id = @uid');
  const usuario = uRes.recordset[0];
  if (!usuario) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });

  let membresia = null;
  try {
    membresia = await authRepository.obtenerMembresia(usuario_id, empresa_id);
  } catch (e) {
    // Fallback
    if (usuario.empresa_id === empresa_id) {
      membresia = { rol: usuario.rol, activo: true };
    }
  }
  if (!membresia || !membresia.activo) {
    throw Object.assign(new Error('Sin acceso a esa empresa'), { statusCode: 403 });
  }

  const token = generarToken(buildTokenPayload(usuario, empresa_id, membresia.rol));
  logger.info({ usuario_id, empresa_id, rol: membresia.rol }, 'Empresa seleccionada, token generado');
  return {
    token,
    user: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, empresa_id, rol: membresia.rol },
  };
}

// ─── Registro ─────────────────────────────────────────────────────────────────

async function registerEmpresa({ empresaNombre, nombre, email, password }) {
  if (!empresaNombre || !nombre || !email || !password) {
    throw Object.assign(new Error('Todos los campos son requeridos.'), { statusCode: 400 });
  }

  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const resEmpresa = await new sql.Request(transaction)
      .input('nombre_empresa', sql.VarChar, empresaNombre)
      .query(`INSERT INTO Empresa (nombre, documento_identidad) OUTPUT INSERTED.id VALUES (@nombre_empresa, 'Pendiente')`);

    const empresa_id = resEmpresa.recordset[0].id;

    // ── NUEVO: Series de facturación por defecto para el nuevo tenant ──────
    await new sql.Request(transaction)
      .input('eid', sql.Int, empresa_id)
      .query("INSERT INTO ConfigComprobantes (empresa_id, tipo_comprobante, prefijo, proximo_nro, activo) VALUES (@eid, 'Factura', '0001', 1, 1)");

    // ── NUEVO: Depósito Principal por defecto ──
    const resDep = await new sql.Request(transaction)
      .input('eid', sql.Int, empresa_id)
      .query("INSERT INTO Depositos (empresa_id, nombre, direccion, es_principal, activo) OUTPUT INSERTED.id VALUES (@eid, 'Depósito Principal', 'Central', 1, 1)");
    
    // ── NUEVO: Caja POS Principal por defecto ──
    // POS Cajas no requiere sucursal_id obligatoriamente, se puede vincular luego
    await new sql.Request(transaction)
      .input('eid', sql.Int, empresa_id)
      .query("INSERT INTO POS_Cajas (empresa_id, nombre, activa) VALUES (@eid, 'Caja Principal', 1)");

    // ── NUEVO: Sembrar Roles por defecto (¡CRÍTICO PARA RBAC!) ──
    await new sql.Request(transaction)
      .input('eid', sql.Int, empresa_id)
      .input('adminPerm', sql.NVarChar, '{"*":["leer","crear","actualizar","eliminar","exportar"]}')
      .input('gerentePerm', sql.NVarChar, '{"dashboard":["leer"],"facturacion":["leer","crear","exportar"],"movimientos":["leer","crear","actualizar","exportar"],"productos":["leer","crear","actualizar","exportar"],"clientes":["leer","crear","actualizar","exportar"],"reportes":["leer","exportar"]}')
      .input('cajeroPerm', sql.NVarChar, '{"dashboard":["leer"],"facturacion":["leer","crear"],"clientes":["leer","crear"],"movimientos":["leer"]}')
      .query(`
        INSERT INTO Roles (empresa_id, nombre, codigo_rol, permisos, es_sistema) VALUES 
        (@eid, 'Administrador', 'admin', @adminPerm, 1),
        (@eid, 'Gerente', 'gerente', @gerentePerm, 1),
        (@eid, 'Cajero', 'cajero', @cajeroPerm, 1)
      `);

    const hashedPassword = await bcrypt.hash(password, 12);

    const resUser = await new sql.Request(transaction)
      .input('nombre', sql.VarChar, nombre)
      .input('email', sql.VarChar, email)
      .input('password_hash', sql.VarChar, hashedPassword)
      .input('rol', sql.VarChar, 'admin')
      .input('empresa_id', sql.Int, empresa_id)
      .query(`INSERT INTO Usuarios (nombre, email, password_hash, rol, empresa_id) OUTPUT INSERTED.id VALUES (@nombre, @email, @password_hash, @rol, @empresa_id)`);

    const usuario_id = resUser.recordset[0].id;

    // Insertar membresía — tolerar si UsuarioEmpresas no existe aún
    try {
      await new sql.Request(transaction)
        .input('uid', sql.Int, usuario_id)
        .input('eid', sql.Int, empresa_id)
        .input('rol', sql.VarChar, 'admin')
        .query(`INSERT INTO UsuarioEmpresas (usuario_id, empresa_id, rol, activo) VALUES (@uid, @eid, @rol, 1)`);
    } catch { /* tabla puede no existir — se sincroniza en primer login */ }

    await transaction.commit();
    logger.info({ empresa_id, email }, 'Nueva empresa y admin creados');
    return { message: 'Empresa y Usuario Administrador creados exitosamente.' };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function crearUsuarioAdmin({ nombre, email, password, rol, empresa_id }) {
  if (!ROLES_PERMITIDOS.includes(rol)) {
    throw Object.assign(new Error(`Rol inválido. Use: ${ROLES_PERMITIDOS.join(', ')}`), { statusCode: 400 });
  }
  if (!password || password.length < 8) {
    throw Object.assign(new Error('La contraseña debe tener al menos 8 caracteres.'), { statusCode: 400 });
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  return await authRepository.crearUsuario(nombre, email, hashedPassword, rol, empresa_id);
}

// ─── Gestión de usuarios ──────────────────────────────────────────────────────

async function obtenerUsuarios(empresa_id) {
  return await authRepository.obtenerUsuarios(empresa_id);
}

async function obtenerMisEmpresas(usuario_id) {
  let membresias = await authRepository.obtenerMembresiasPorUsuario(usuario_id);
  if (!membresias || membresias.length === 0) {
    const pool = await connectDB();
    const uRes = await pool.request().input('uid', sql.Int, usuario_id).query('SELECT empresa_id, rol FROM Usuarios WHERE id = @uid');
    const u = uRes.recordset[0];
    if (u && u.empresa_id) {
      let empNom = 'Principal';
      try {
        const eRes = await pool.request().input('eid', sql.Int, u.empresa_id).query('SELECT nombre FROM Empresa WHERE id = @eid');
        if (eRes.recordset[0]) empNom = eRes.recordset[0].nombre;
      } catch (ex) { }
      membresias = [{ empresa_id: u.empresa_id, rol: u.rol, empresa_nombre: empNom, activo: true }];
    }
  }
  return membresias;
}

async function actualizarRolUsuario(usuario_id, empresa_id, rol) {
  if (!ROLES_PERMITIDOS.includes(rol)) {
    throw Object.assign(new Error(`Rol inválido. Use: ${ROLES_PERMITIDOS.join(', ')}`), { statusCode: 400 });
  }
  return await authRepository.actualizarRolEnEmpresa(usuario_id, empresa_id, rol);
}

async function agregarUsuarioAEmpresa(usuario_id, empresa_id, rol) {
  if (!ROLES_PERMITIDOS.includes(rol)) {
    throw Object.assign(new Error(`Rol inválido. Use: ${ROLES_PERMITIDOS.join(', ')}`), { statusCode: 400 });
  }
  // Verificar que el usuario existe
  const pool = await connectDB();
  const uRes = await pool.request()
    .input('uid', sql.Int, usuario_id)
    .query('SELECT id FROM Usuarios WHERE id = @uid');
  if (!uRes.recordset[0]) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });

  return await authRepository.agregarOReactivarMembresia(usuario_id, empresa_id, rol);
}

/**
 * Revoca acceso de un usuario a la empresa (soft delete de membresía).
 * No elimina el usuario — solo desactiva en esa empresa.
 */
async function revocarAcceso(usuario_id, empresa_id) {
  return await authRepository.revocarAccesoEmpresa(usuario_id, empresa_id);
}

/**
 * Backward compat — elimina usuario (hard delete desde empresa_id original).
 */
async function eliminarUsuario(id, empresa_id) {
  // Solo soft delete de la membresía — la cuenta queda para otras empresas
  await authRepository.revocarAccesoEmpresa(id, empresa_id);
  return { mensaje: 'Acceso revocado correctamente' };
}

/**
 * Actualiza nombre y/o email de un usuario (admin de la misma empresa).
 */
async function actualizarUsuario(usuario_id, empresa_id, { nombre, email }) {
  if (!nombre && !email) {
    throw Object.assign(new Error('Debe proveer al menos nombre o email'), { statusCode: 400 });
  }
  const pool = await connectDB();

  // Verificar que el usuario pertenece a la empresa
  const check = await pool.request()
    .input('uid', sql.Int, usuario_id)
    .input('eid', sql.Int, empresa_id)
    .query('SELECT 1 FROM Usuarios WHERE id = @uid AND empresa_id = @eid');
  if (!check.recordset[0]) {
    throw Object.assign(new Error('Usuario no encontrado en esta empresa'), { statusCode: 404 });
  }

  // Construir query dinámico
  const sets = [];
  const req = pool.request().input('uid', sql.Int, usuario_id);
  if (nombre) { req.input('nombre', sql.NVarChar(255), nombre); sets.push('nombre = @nombre'); }
  if (email) { req.input('email', sql.NVarChar(255), email); sets.push('email = @email'); }

  await req.query(`UPDATE Usuarios SET ${sets.join(', ')} WHERE id = @uid`);
  return { mensaje: 'Usuario actualizado correctamente' };
}

/**
 * Resetea la contraseña de un usuario (solo admin de la misma empresa puede hacerlo).
 */
async function resetearPassword(usuario_id, empresa_id, nuevaPassword) {
  const pool = await connectDB();
  const check = await pool.request()
    .input('uid', sql.Int, usuario_id)
    .input('eid', sql.Int, empresa_id)
    .query('SELECT 1 FROM Usuarios WHERE id = @uid AND empresa_id = @eid');
  if (!check.recordset[0]) {
    throw Object.assign(new Error('Usuario no encontrado en esta empresa'), { statusCode: 404 });
  }
  const hashedPassword = await bcrypt.hash(nuevaPassword, 12);
  await pool.request()
    .input('uid', sql.Int, usuario_id)
    .input('hash', sql.VarChar(255), hashedPassword)
    .query('UPDATE Usuarios SET password_hash = @hash WHERE id = @uid');
}

/**
 * Obtiene todas las empresas disponibles (para el dropdown de asignación de acceso).
 */
async function obtenerEmpresasDisponibles() {
  const pool = await connectDB();
  const result = await pool.request()
    .query('SELECT id, nombre FROM Empresa WHERE activo = 1 OR activo IS NULL ORDER BY nombre ASC');
  return result.recordset;
}

/**
 * Obtiene la lista global de usuarios y sus membresías (Solo Admin Global).
 */
async function obtenerUsuariosGlobal() {
  return await authRepository.obtenerUsuariosGlobal();
}

/**
 * Genera un token de recuperación y lo envía por email.
 */
async function forgotPassword(email) {
  const pool = await connectDB();
  const uRes = await pool.request()
    .input('email', sql.NVarChar(255), email)
    .query('SELECT id, nombre FROM Usuarios WHERE email = @email AND activo = 1');

  const usuario = uRes.recordset[0];
  if (!usuario) {
    // Por seguridad, no informamos si el email no existe, pero logueamos.
    logger.info({ email }, 'Forgot password: email no encontrado');
    return;
  }

  const token = require('crypto').randomBytes(32).toString('hex');
  const exp = new Date(Date.now() + 3600000); // 1 hora de validez

  await pool.request()
    .input('uid', sql.Int, usuario.id)
    .input('token', sql.NVarChar(255), token)
    .input('exp', sql.DateTime2, exp)
    .query('UPDATE Usuarios SET reset_token = @token, reset_token_exp = @exp WHERE id = @uid');

  // Enviar email usando BullMQ (emailWorker)
  const { emailQueue } = require('../../config/queue');

  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  try {
    await emailQueue.add('recuperacion-password', {
      to: email,
      subject: 'Restablecimiento de Contraseña - Stock Pro',
      text: `Hola ${usuario.nombre},\n\nHas solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:\n\n${resetLink}\n\nSi no solicitaste esto, ignora este correo.\n\nEste enlace expirará en 1 hora.`
    });
    logger.info({ userId: usuario.id }, 'Email de recuperación encolado (BullMQ)');
  } catch (err) {
    logger.error({ error: err.message }, 'Error encolando email de recuperación');
  }
}

/**
 * Valida el token y actualiza la contraseña.
 */
async function resetPassword(token, nuevaPassword) {
  const pool = await connectDB();
  const uRes = await pool.request()
    .input('token', sql.NVarChar(255), token)
    .query('SELECT id FROM Usuarios WHERE reset_token = @token AND reset_token_exp > GETUTCDATE()');

  const usuario = uRes.recordset[0];
  if (!usuario) {
    throw Object.assign(new Error('Token inválido o expirado'), { statusCode: 400 });
  }

  const hashedPassword = await bcrypt.hash(nuevaPassword, 12);

  await pool.request()
    .input('uid', sql.Int, usuario.id)
    .input('hash', sql.VarChar(255), hashedPassword)
    .query('UPDATE Usuarios SET password_hash = @hash, reset_token = NULL, reset_token_exp = NULL WHERE id = @uid');

  logger.info({ userId: usuario.id }, 'Contraseña restablecida vía token');
}

async function refreshToken(userPayload) {
  if (!userPayload || !userPayload.id || !userPayload.email) {
    throw Object.assign(new Error('Payload inválido para refrescar el token'), { statusCode: 401 });
  }
  
  const payload = {
    id: userPayload.id,
    nombre: userPayload.nombre,
    email: userPayload.email,
    empresa_id: userPayload.empresa_id,
    rol: userPayload.rol,
  };

  const newToken = generarToken(payload);
  
  return { 
    token: newToken, 
    user: payload 
  };
}

module.exports = {
  login,
  seleccionarEmpresa,
  registerEmpresa,
  crearUsuarioAdmin,
  obtenerUsuarios,
  obtenerMisEmpresas,
  actualizarRolUsuario,
  agregarUsuarioAEmpresa,
  revocarAcceso,
  eliminarUsuario,
  actualizarUsuario,
  resetearPassword,
  obtenerEmpresasDisponibles,
  obtenerUsuariosGlobal,
  forgotPassword,
  resetPassword,
  refreshToken,
};
