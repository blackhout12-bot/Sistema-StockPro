// src/modules/auth/auth.model.js
const { sql, connectDB } = require('../config/db');

// ─── Usuarios ────────────────────────────────────────────────────────────────

async function obtenerUsuarioPorEmail(email) {
  const pool = await connectDB();
  const result = await pool.request()
    .input('email', sql.VarChar, email)
    .query('SELECT * FROM Usuarios WHERE email = @email');
  return result.recordset[0] || null;
}

/**
 * Inserta usuario + membresía inicial en UsuarioEmpresas (transacción).
 * Backward compatible: también actualiza empresa_id y rol en Usuarios.
 */
async function crearUsuario(nombre, email, passwordHash, rol, empresa_id) {
  const pool = await connectDB();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    // 1. Insertar usuario
    const res = await new sql.Request(tx)
      .input('nombre', sql.NVarChar(255), nombre)
      .input('email', sql.NVarChar(255), email)
      .input('password_hash', sql.VarChar(255), passwordHash)
      .input('rol', sql.NVarChar(50), rol)
      .input('empresa_id', sql.Int, empresa_id)
      .query(`
            DECLARE @InsertedRows TABLE (id INT);
            INSERT INTO Usuarios (nombre, email, password_hash, rol, empresa_id)
            OUTPUT INSERTED.id INTO @InsertedRows
            VALUES (@nombre, @email, @password_hash, @rol, @empresa_id);
            SELECT id FROM @InsertedRows;
            `);
    const usuario_id = res.recordset[0].id;

    // 2. Crear membresía en UsuarioEmpresas
    await _insertarMembresia(tx, usuario_id, empresa_id, rol);

    await tx.commit();
    return { id: usuario_id, nombre, email, rol, empresa_id };
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

async function _insertarMembresia(requestOrPool, usuario_id, empresa_id, rol) {
  const req = requestOrPool instanceof sql.Transaction
    ? new sql.Request(requestOrPool)
    : requestOrPool.request();
  await req
    .input('uid', sql.Int, usuario_id)
    .input('eid', sql.Int, empresa_id)
    .input('rol', sql.NVarChar(50), rol)
    .query(`
            IF NOT EXISTS (
                SELECT 1 FROM UsuarioEmpresas WHERE usuario_id=@uid AND empresa_id=@eid
            )
            INSERT INTO UsuarioEmpresas (usuario_id, empresa_id, rol, activo)
            VALUES (@uid, @eid, @rol, 1)
        `);
}

// ─── Membresías ──────────────────────────────────────────────────────────────

/**
 * Devuelve las empresas a las que tiene acceso el usuario con su rol.
 */
async function obtenerMembresiasPorUsuario(usuario_id) {
  const pool = await connectDB();
  const result = await pool.request()
    .input('uid', sql.Int, usuario_id)
    .query(`
            SELECT
                ue.empresa_id,
                ue.rol,
                ue.activo,
                ue.fecha_union,
                e.nombre AS empresa_nombre,
                e.logo_url,
                e.documento_identidad
            FROM UsuarioEmpresas ue
            INNER JOIN Empresa e ON ue.empresa_id = e.id
            WHERE ue.usuario_id = @uid AND ue.activo = 1
            ORDER BY ue.fecha_union ASC
        `);
  return result.recordset;
}

/**
 * Obtiene la membresía específica de un usuario en una empresa.
 */
async function obtenerMembresia(usuario_id, empresa_id) {
  const pool = await connectDB();
  const result = await pool.request()
    .input('uid', sql.Int, usuario_id)
    .input('eid', sql.Int, empresa_id)
    .query(`
            SELECT * FROM UsuarioEmpresas
            WHERE usuario_id = @uid AND empresa_id = @eid
        `);
  return result.recordset[0] || null;
}

/**
 * Obtiene el plan y módulos habilitados para una empresa específica.
 */
async function obtenerPlanEmpresa(empresa_id) {
  const pool = await connectDB();
  const result = await pool.request()
    .input('eid', sql.Int, empresa_id)
    .query(`
      SELECT p.id, p.nombre, p.modulos_json
      FROM Empresa e
      JOIN Planes p ON e.plan_id = p.id
      WHERE e.id = @eid
    `);
  
  if (!result.recordset[0]) return null;
  
  try {
    const plan = result.recordset[0];
    plan.modulos = typeof plan.modulos_json === 'string' 
      ? JSON.parse(plan.modulos_json) 
      : plan.modulos_json;
    return plan;
  } catch (e) {
    return null;
  }
}

/**
 * Agrega acceso de un usuario a una empresa con un rol específico.
 * Reactiva si ya tenía acceso pero estaba inactivo.
 */
async function agregarOReactivarMembresia(usuario_id, empresa_id, rol) {
  const pool = await connectDB();
  await pool.request()
    .input('uid', sql.Int, usuario_id)
    .input('eid', sql.Int, empresa_id)
    .input('rol', sql.NVarChar(50), rol)
    .query(`
            IF EXISTS (SELECT 1 FROM UsuarioEmpresas WHERE usuario_id=@uid AND empresa_id=@eid)
                UPDATE UsuarioEmpresas SET rol=@rol, activo=1 WHERE usuario_id=@uid AND empresa_id=@eid
            ELSE
                INSERT INTO UsuarioEmpresas (usuario_id, empresa_id, rol, activo) VALUES (@uid, @eid, @rol, 1)
        `);
}

/**
 * Actualiza el rol de un usuario en una empresa específica.
 */
async function actualizarRolEnEmpresa(usuario_id, empresa_id, rol) {
  const pool = await connectDB();
  await pool.request()
    .input('uid', sql.Int, usuario_id)
    .input('eid', sql.Int, empresa_id)
    .input('rol', sql.NVarChar(50), rol)
    .query(`
            UPDATE UsuarioEmpresas SET rol = @rol
            WHERE usuario_id = @uid AND empresa_id = @eid
        `);
  // Backward compat: también actualiza rol en Usuarios si es la empresa principal
  await pool.request()
    .input('uid', sql.Int, usuario_id)
    .input('eid', sql.Int, empresa_id)
    .input('rol', sql.NVarChar(50), rol)
    .query('UPDATE Usuarios SET rol = @rol WHERE id = @uid AND empresa_id = @eid');
}

/**
 * Revoca acceso de un usuario a una empresa (soft delete).
 */
async function revocarAccesoEmpresa(usuario_id, empresa_id) {
  const pool = await connectDB();
  await pool.request()
    .input('uid', sql.Int, usuario_id)
    .input('eid', sql.Int, empresa_id)
    .query('UPDATE UsuarioEmpresas SET activo = 0 WHERE usuario_id = @uid AND empresa_id = @eid');
}

/**
 * Listar TODOS los miembros de TODAS las empresas del sistema (Admin Global).
 * Útil para la pestaña de Acceso Global.
 */
async function obtenerUsuariosGlobal() {
  const pool = await connectDB();
  try {
    const result = await pool.request()
      .query(`
          SELECT
              u.id,
              u.nombre,
              u.email,
              e.nombre AS empresa_nombre,
              e.id AS empresa_id,
              ue.rol,
              ue.activo AS activo_en_empresa,
              ue.fecha_union,
              (SELECT COUNT(*) FROM UsuarioEmpresas ue2 WHERE ue2.usuario_id = u.id AND ue2.activo = 1) AS num_empresas
          FROM UsuarioEmpresas ue
          INNER JOIN Usuarios u ON ue.usuario_id = u.id
          INNER JOIN Empresa e ON ue.empresa_id = e.id
          WHERE ue.activo = 1
          ORDER BY u.nombre ASC, e.nombre ASC
      `);
    return result.recordset;
  } catch (err) {
    console.error('Error en obtenerUsuariosGlobal:', err);
    throw err;
  }
}

/**
 * Obtiene usuarios vinculados a una empresa específica.
 */
async function obtenerUsuariosPorEmpresa(empresa_id) {
  const pool = await connectDB();
  const result = await pool.request()
    .input('eid', sql.Int, empresa_id)
    .query(`
      SELECT 
        u.id, u.nombre, u.email, ue.rol, ue.activo, ue.fecha_union,
        (SELECT COUNT(*) FROM UsuarioEmpresas ue2 WHERE ue2.usuario_id = u.id AND ue2.activo = 1) AS num_empresas
      FROM Usuarios u
      INNER JOIN UsuarioEmpresas ue ON u.id = ue.usuario_id
      WHERE ue.empresa_id = @eid AND ue.activo = 1
      ORDER BY u.nombre ASC
    `);
  return result.recordset;
}

/**
 * Backward compat — mantiene API para obtenerUsuarios(empresa_id).
 */
async function obtenerUsuarios(empresa_id) {
  return obtenerUsuariosPorEmpresa(empresa_id);
}

/**
 * Verifica si un rol específico tiene un permiso para un recurso y acción determinados.
 * Busca en la tabla RolPermisos unida a Permisos.
 */
async function verificarPermisoRol(empresa_id, rol_codigo, recurso, accion) {
  if (!empresa_id || !rol_codigo) return false;
  
  const pool = await connectDB();
  const result = await pool.request()
    .input('empresa_id', sql.Int, empresa_id)
    .input('codigo_rol', sql.NVarChar(50), rol_codigo)
    .query(`
      SELECT permisos 
      FROM dbo.Roles
      WHERE empresa_id = @empresa_id AND codigo_rol = @codigo_rol AND activo = 1
    `);
    
  if (result.recordset.length === 0) {
      console.log(`[RBAC] No se encontró rol ${rol_codigo} para empresa ${empresa_id}`);
      return false;
  }
  
  try {
    const rawPermisos = result.recordset[0].permisos;
    const permisos = JSON.parse(rawPermisos);
    
    // Check wildcard total (*)
    if (permisos['*'] && permisos['*'].includes(accion)) return true;
    
    // Check specific module
    if (permisos[recurso] && permisos[recurso].includes(accion)) return true;
    
    console.log(`[RBAC] ReCHAZADO: empresa=${empresa_id}, rol=${rol_codigo}, recurso=${recurso}, accion=${accion}. Permisos JSON:`, permisos);
    return false;
  } catch (err) {
    console.error('Error parseando JSON de permisos:', err);
    return false;
  }
}

/**
 * Listar todas las empresas con su plan actual (SuperAdmin).
 */
async function obtenerTodasLasEmpresas() {
  const pool = await connectDB();
  const result = await pool.request()
    .query(`
      SELECT 
        e.id, 
        e.nombre, 
        e.documento_identidad, 
        p.nombre as plan_nombre, 
        p.id as plan_id
      FROM Empresa e
      LEFT JOIN Planes p ON e.plan_id = p.id
      ORDER BY e.nombre ASC
    `);
  return result.recordset;
}

/**
 * Actualiza el plan de una empresa.
 */
async function actualizarPlanEmpresa(empresa_id, plan_id) {
  const pool = await connectDB();
  await pool.request()
    .input('eid', sql.Int, empresa_id)
    .input('pid', sql.Int, plan_id)
    .query('UPDATE Empresa SET plan_id = @pid WHERE id = @eid');
  return true;
}

/**
 * Obtiene el nombre de un plan por su ID.
 */
async function obtenerNombrePlan(plan_id) {
  const pool = await connectDB();
  const result = await pool.request()
    .input('pid', sql.Int, plan_id)
    .query('SELECT nombre FROM Planes WHERE id = @pid');
  return result.recordset[0]?.nombre || 'Desconocido';
}

/**
 * Genera el objeto de feature toggles basado en el plan_id.
 */
async function generarFeatureToggles(plan_id) {
  const pool = await connectDB();
  const result = await pool.request()
    .input('pid', sql.Int, plan_id)
    .query('SELECT modulos_json FROM Planes WHERE id = @pid');
  
  if (!result.recordset[0]) return {};

  try {
    const modulos = JSON.parse(result.recordset[0].modulos_json);
    // Convertir { mod: true } o similar a toggles
    return modulos;
  } catch (e) {
    return { error: 'Invalid plan config' };
  }
}

module.exports = {
  obtenerUsuarioPorEmail,
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuariosPorEmpresa,
  obtenerMembresiasPorUsuario,
  obtenerMembresia,
  obtenerPlanEmpresa,
  agregarOReactivarMembresia,
  actualizarRolEnEmpresa,
  revocarAccesoEmpresa,
  obtenerUsuariosGlobal,
  verificarPermisoRol,
  obtenerTodasLasEmpresas,
  actualizarPlanEmpresa,
  obtenerNombrePlan,
  generarFeatureToggles
};
