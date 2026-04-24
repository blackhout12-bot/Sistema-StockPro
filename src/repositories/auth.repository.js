// src/modules/auth/auth.model.js
const { sql, connectDB } = require('../config/db');

// ─── Usuarios ────────────────────────────────────────────────────────────────

async function obtenerUsuarioPorEmail(email) {
  const pool = await connectDB();
  const result = await pool.request()
    .input('email', sql.VarChar, email)
    .query('SELECT * FROM Usuarios WHERE email = @email');
  
  const user = result.recordset[0] || null;
  if (user && (user.rol === 'superadmin' || user.role === 'superadmin')) {
      user.empresa_id = null; // Purificación v1.29.3
      user.panel = 'global';
  }
  return user;
}

/**
 * Inserta usuario + membresía inicial en UsuarioEmpresas (transacción).
 * Backward compatible: también actualiza empresa_id y rol en Usuarios.
 */
async function crearUsuario(nombre, email, passwordHash, rol, empresa_id) {
  // v1.29.5 - Purificación del rol SuperAdmin
  if (rol === 'superadmin') {
    empresa_id = null;
  }

  const pool = await connectDB();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    // 1. Insertar usuario
    let db_empresa_id = empresa_id;
    if (rol === 'superadmin') {
        db_empresa_id = null; // Purificación real: el rol superadmin inserta NULL
    }

    const res = await new sql.Request(tx)
      .input('nombre', sql.NVarChar(255), nombre)
      .input('email', sql.NVarChar(255), email)
      .input('password_hash', sql.VarChar(255), passwordHash)
      .input('rol', sql.NVarChar(50), rol)
      .input('empresa_id', sql.Int, db_empresa_id)
      .query(`
            DECLARE @InsertedRows TABLE (id INT);
            INSERT INTO Usuarios (nombre, email, password_hash, rol, empresa_id)
            OUTPUT INSERTED.id INTO @InsertedRows
            VALUES (@nombre, @email, @password_hash, @rol, @empresa_id);
            SELECT id FROM @InsertedRows;
            `);
    const usuario_id = res.recordset[0].id;

    // 2. Crear membresía en UsuarioEmpresas (Saltado para contexto global)
    if (rol !== 'superadmin') {
      await _insertarMembresia(tx, usuario_id, empresa_id, rol);
    }

    await tx.commit();
    return { id: usuario_id, nombre, email, rol, empresa_id: (rol === 'superadmin' ? null : empresa_id) };
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
            IF @rol = 'superadmin' SET @eid = NULL;
            IF NOT EXISTS (
                SELECT 1 FROM UsuarioEmpresas WHERE usuario_id=@uid AND (@eid IS NULL OR empresa_id=@eid)
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
 * Obtiene la descripción de un plan por su ID.
 */
async function obtenerDescripcionPlan(plan_id) {
  const pool = await connectDB();
  try {
    const result = await pool.request()
      .input('pid', sql.Int, plan_id)
      .query('SELECT descripcion FROM Planes WHERE id = @pid');
    return result.recordset[0]?.descripcion || 'Sin descripción detallada';
  } catch (e) {
    // Fallback si la columna no existe en la BD actual.
    return 'Características activas para la organización.';
  }
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

// ─── SuperAdmin Enhancements v1.28.7 ────────────────────────────────────────

async function backupEmpresas(empresaIds, usuario_ejecutor) {
    const pool = await connectDB();
    const ids = empresaIds.join(',');
    
    // Backup Empresa
    const empresaRes = await pool.request().query(`SELECT * FROM Empresa WHERE id IN (${ids})`);
    // Backup Sucursales
    const sucursalesRes = await pool.request().query(`SELECT * FROM Sucursales WHERE empresa_id IN (${ids})`);
    // Backup Depositos
    const depositosRes = await pool.request().query(`SELECT * FROM Depositos WHERE empresa_id IN (${ids})`);
    // Backup Usuarios
    const usuariosRes = await pool.request().query(`SELECT * FROM Usuarios WHERE empresa_id IN (${ids})`);
    
    const fullData = {
        empresas: empresaRes.recordset,
        sucursales: sucursalesRes.recordset,
        depositos: depositosRes.recordset,
        usuarios: usuariosRes.recordset
    };

    const backupResult = await pool.request()
        .input('tipo', 'empresa')
        .input('data_json', JSON.stringify(fullData))
        .input('usuario', usuario_ejecutor)
        .query(`
            INSERT INTO Backup_Eliminaciones (tipo, data_json, usuario_ejecutor)
            OUTPUT INSERTED.id
            VALUES (@tipo, @data_json, @usuario)
        `);
    return backupResult.recordset[0].id;
}

async function eliminarUsuariosPorEmpresa(empresaIds, tx) {
    const ids = empresaIds.join(',');
    const req = tx ? new sql.Request(tx) : (await connectDB()).request();
    await req.query(`DELETE FROM Delegaciones WHERE delegante_id IN (SELECT id FROM Usuarios WHERE empresa_id IN (${ids})) OR delegado_id IN (SELECT id FROM Usuarios WHERE empresa_id IN (${ids}))`);
    await req.query(`DELETE FROM UsuarioEmpresas WHERE empresa_id IN (${ids})`);
    await req.query(`DELETE FROM Usuarios WHERE empresa_id IN (${ids})`);
}

async function eliminarDepositosPorEmpresa(empresaIds, tx) {
    const ids = empresaIds.join(',');
    const req = tx ? new sql.Request(tx) : (await connectDB()).request();
    await req.query(`DELETE FROM Depositos WHERE empresa_id IN (${ids})`);
}

async function eliminarSucursalesPorEmpresa(empresaIds, tx) {
    const ids = empresaIds.join(',');
    const req = tx ? new sql.Request(tx) : (await connectDB()).request();
    // Las cajas y sesiones se borran en eliminarTransaccionalesPorEmpresa
    await req.query(`DELETE FROM Sucursales WHERE empresa_id IN (${ids})`);
}

async function eliminarTransaccionalesPorEmpresa(empresaIds, tx) {
    const ids = empresaIds.join(',');
    const req = tx ? new sql.Request(tx) : (await connectDB()).request();
    
    // 1. POS (Dependen de Usuarios y Cajas/Sucursales)
    await req.query(`DELETE FROM POS_Sesiones WHERE empresa_id IN (${ids}) OR usuario_id IN (SELECT id FROM Usuarios WHERE empresa_id IN (${ids})) OR caja_id IN (SELECT id FROM POS_Cajas WHERE sucursal_id IN (SELECT id FROM Sucursales WHERE empresa_id IN (${ids})))`);
    await req.query(`DELETE FROM POS_Cajas WHERE empresa_id IN (${ids}) OR sucursal_id IN (SELECT id FROM Sucursales WHERE empresa_id IN (${ids}))`);

    // 2. Cobros y Pagos (Dependen de Facturas y Compras, o independientes)
    await req.query(`DELETE FROM Cobros WHERE empresa_id IN (${ids})`);
    await req.query(`DELETE FROM Pagos WHERE empresa_id IN (${ids})`);
    
    // 3. Cuentas Cobrar y Pagar (Dependen de Facturas y Compras)
    await req.query(`DELETE FROM Cuentas_Cobrar WHERE empresa_id IN (${ids}) OR factura_id IN (SELECT id FROM Facturas WHERE empresa_id IN (${ids}))`);
    await req.query(`DELETE FROM Cuentas_Pagar WHERE empresa_id IN (${ids}) OR compra_id IN (SELECT id FROM Compras WHERE empresa_id IN (${ids}))`);
    
    // 4. Detalles de Facturas y Compras
    await req.query(`DELETE FROM Detalle_Facturas WHERE factura_id IN (SELECT id FROM Facturas WHERE empresa_id IN (${ids}) OR usuario_id IN (SELECT id FROM Usuarios WHERE empresa_id IN (${ids})))`);
    await req.query(`DELETE FROM Compras_Detalle WHERE compra_id IN (SELECT id FROM Compras WHERE empresa_id IN (${ids}))`);
    
    // 5. Cabeceras
    await req.query(`DELETE FROM Facturas WHERE empresa_id IN (${ids}) OR usuario_id IN (SELECT id FROM Usuarios WHERE empresa_id IN (${ids}))`);
    await req.query(`DELETE FROM Compras WHERE empresa_id IN (${ids})`);
    
    // 6. Inventario
    await req.query(`DELETE FROM MovimientosStock WHERE empresa_id IN (${ids})`);
    await req.query(`DELETE FROM Movimientos WHERE empresa_id IN (${ids}) OR usuarioId IN (SELECT id FROM Usuarios WHERE empresa_id IN (${ids})) OR productoId IN (SELECT id FROM Productos WHERE empresa_id IN (${ids}))`);
    await req.query(`DELETE FROM Kardex WHERE empresa_id IN (${ids})`);
    await req.query(`DELETE FROM TransferenciasStock WHERE empresa_id IN (${ids}) OR usuario_id IN (SELECT id FROM Usuarios WHERE empresa_id IN (${ids}))`);
}

async function eliminarMaestrosPorEmpresa(empresaIds, tx) {
    const ids = empresaIds.join(',');
    const req = tx ? new sql.Request(tx) : (await connectDB()).request();
    
    await req.query(`DELETE FROM Lotes WHERE empresa_id IN (${ids}) OR producto_id IN (SELECT id FROM Productos WHERE empresa_id IN (${ids}))`);
    await req.query(`DELETE FROM ProductoDepositos WHERE empresa_id IN (${ids}) OR producto_id IN (SELECT id FROM Productos WHERE empresa_id IN (${ids})) OR deposito_id IN (SELECT id FROM Depositos WHERE empresa_id IN (${ids}))`);
    await req.query(`DELETE FROM PreciosSucursal WHERE empresa_id IN (${ids}) OR producto_id IN (SELECT id FROM Productos WHERE empresa_id IN (${ids})) OR sucursal_id IN (SELECT id FROM Sucursales WHERE empresa_id IN (${ids}))`);
    await req.query(`DELETE FROM Productos WHERE empresa_id IN (${ids})`);
    
    await req.query(`DELETE FROM Clientes WHERE empresa_id IN (${ids})`);
    await req.query(`DELETE FROM Proveedores WHERE empresa_id IN (${ids})`);
    await req.query(`DELETE FROM Categorias_Esquemas WHERE empresa_id IN (${ids})`);
    await req.query(`DELETE FROM Categorias WHERE empresa_id IN (${ids})`);
    
    await req.query(`DELETE FROM Contextos WHERE empresa_id IN (${ids})`);
    await req.query(`DELETE FROM Monedas WHERE empresa_id IN (${ids})`);
}

async function eliminarLogsPorEmpresa(empresaIds, tx) {
    const ids = empresaIds.join(',');
    const req = tx ? new sql.Request(tx) : (await connectDB()).request();
    
    await req.query(`DELETE FROM AuditoriaMoneda WHERE empresa_id IN (${ids})`);
    await req.query(`DELETE FROM Auditoria WHERE empresa_id IN (${ids})`);
    await req.query(`DELETE FROM Logs WHERE empresa_id IN (${ids})`);
    await req.query(`DELETE FROM SSOLog WHERE empresa_id IN (${ids})`);
    await req.query(`DELETE FROM OLAPLog WHERE empresa_id IN (${ids})`);
    await req.query(`DELETE FROM Notificaciones WHERE empresa_id IN (${ids})`);
}

async function eliminarEmpresas(empresaIds) {
    const pool = await connectDB();
    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
        const ids = empresaIds.join(',');
        
        // 0. Romper dependencia circular de Monedas (FK_Empresa_Moneda y FK_Producto_Moneda)
        await new sql.Request(tx).query(`UPDATE Empresa SET moneda_base_id = NULL WHERE id IN (${ids}) OR moneda_base_id IN (SELECT id FROM Monedas WHERE empresa_id IN (${ids}))`);
        await new sql.Request(tx).query(`UPDATE Productos SET moneda_id = NULL WHERE moneda_id IN (SELECT id FROM Monedas WHERE empresa_id IN (${ids}))`);
        
        // ORDEN JERÁRQUICO TOTAL v1.29.10
        // 1. Logs y Auditoría
        await eliminarLogsPorEmpresa(empresaIds, tx);
        
        // 2. Transaccionales (Ventas, Compras, Finanzas, Stock)
        await eliminarTransaccionalesPorEmpresa(empresaIds, tx);
        
        // 3. Maestros (Productos, Clientes, Proveedores, Categorías)
        // Se borran ANTES que infraestructura porque ProductoDepositos/PreciosSucursal dependen de Depositos/Sucursales
        await eliminarMaestrosPorEmpresa(empresaIds, tx);
        
        // 4. Usuarios y Roles (Antes que Sucursales por FK_Usuario_Sucursal)
        await eliminarUsuariosPorEmpresa(empresaIds, tx);
        await new sql.Request(tx).query(`DELETE FROM Roles WHERE empresa_id IN (${ids})`);
        
        // 5. Infraestructura (Depósitos, Sucursales, Cajas)
        await eliminarDepositosPorEmpresa(empresaIds, tx);
        await eliminarSucursalesPorEmpresa(empresaIds, tx);
        
        // 6. Configuración Final
        await new sql.Request(tx).query(`DELETE FROM ConfigComprobantes WHERE empresa_id IN (${ids})`);
        await new sql.Request(tx).query(`DELETE FROM Comprobantes WHERE empresa_id IN (${ids})`);
        await new sql.Request(tx).query(`DELETE FROM ModulosActivos WHERE empresa_id IN (${ids})`);
        await new sql.Request(tx).query(`DELETE FROM EmpresaModulos WHERE empresa_id IN (${ids})`);
        
        // Finalmente eliminar empresa
        await new sql.Request(tx).query(`DELETE FROM Empresa WHERE id IN (${ids})`);
        
        await tx.commit();
        return true;
    } catch (err) {
        await tx.rollback();
        console.error('ERROR CRÍTICO EN DEEP CASCADE DELETE (v1.29.12):', err.message);
        console.error('STACK:', err.stack);
        throw err;
    }
}

async function restaurarEmpresas(backupId) {
    const pool = await connectDB();
    const backup = await pool.request()
        .input('id', backupId)
        .query('SELECT data_json FROM Backup_Eliminaciones WHERE id = @id');
    
    if (!backup.recordset[0]) throw new Error('Backup no encontrado');
    
    const data = JSON.parse(backup.recordset[0].data_json);
    const { empresas, sucursales, depositos, usuarios } = data;

    // Restaurar el árbol jerárquicamente
    
    // 1. Empresas
    if (empresas) {
        for (const e of empresas) {
            await pool.request()
                .input('id', e.id).input('nombre', e.nombre).input('doc', e.documento_identidad).input('plan', e.plan_id)
                .query(`
                    SET IDENTITY_INSERT Empresa ON;
                    MERGE Empresa AS target USING (VALUES (@id, @nombre, @doc, @plan)) AS source (id, nombre, documento_identidad, plan_id) ON target.id = source.id
                    WHEN MATCHED THEN UPDATE SET nombre = source.nombre, documento_identidad = source.documento_identidad, plan_id = source.plan_id
                    WHEN NOT MATCHED THEN INSERT (id, nombre, documento_identidad, plan_id) VALUES (source.id, source.nombre, source.documento_identidad, source.plan_id);
                    SET IDENTITY_INSERT Empresa OFF;
                `);
        }
    }

    // 2. Sucursales
    if (sucursales) {
        for (const s of sucursales) {
            await pool.request()
                .input('id', s.id).input('eid', s.empresa_id).input('nom', s.nombre).input('dir', s.direccion).input('tel', s.telefono).input('act', s.activa)
                .query(`
                    SET IDENTITY_INSERT Sucursales ON;
                    MERGE Sucursales AS target USING (VALUES (@id, @eid, @nom, @dir, @tel, @act)) AS source (id, eid, nombre, direccion, telefono, activa) ON target.id = source.id
                    WHEN MATCHED THEN UPDATE SET nombre = source.nombre, direccion = source.direccion, telefono = source.telefono, activa = source.activa
                    WHEN NOT MATCHED THEN INSERT (id, empresa_id, nombre, direccion, telefono, activa) VALUES (source.id, source.eid, source.nombre, source.direccion, source.telefono, source.activa);
                    SET IDENTITY_INSERT Sucursales OFF;
                `);
        }
    }

    // 3. Depositos
    if (depositos) {
        for (const d of depositos) {
            await pool.request()
                .input('id', d.id).input('eid', d.empresa_id).input('sid', d.sucursal_id).input('nom', d.nombre).input('p', d.es_principal).input('a', d.activo)
                .query(`
                    SET IDENTITY_INSERT Depositos ON;
                    MERGE Depositos AS target USING (VALUES (@id, @eid, @sid, @nom, @p, @a)) AS source (id, eid, sid, nombre, es_principal, activo) ON target.id = source.id
                    WHEN NOT MATCHED THEN INSERT (id, empresa_id, sucursal_id, nombre, es_principal, activo) VALUES (source.id, source.eid, source.sid, source.nombre, source.es_principal, source.activo);
                    SET IDENTITY_INSERT Depositos OFF;
                `);
        }
    }

    // 4. Usuarios
    if (usuarios) {
        for (const u of usuarios) {
            await pool.request()
                .input('id', u.id).input('nom', u.nombre).input('em', u.email).input('pass', u.password_hash).input('rol', u.rol).input('eid', u.empresa_id)
                .query(`
                    SET IDENTITY_INSERT Usuarios ON;
                    MERGE Usuarios AS target USING (VALUES (@id, @nom, @em, @pass, @rol, @eid)) AS source (id, nombre, email, password_hash, rol, eid) ON target.id = source.id
                    WHEN MATCHED THEN UPDATE SET nombre = source.nombre, email = source.email, rol = source.rol, empresa_id = source.eid
                    WHEN NOT MATCHED THEN INSERT (id, nombre, email, password_hash, rol, empresa_id) VALUES (source.id, source.nombre, source.email, source.password_hash, source.rol, source.eid);
                    SET IDENTITY_INSERT Usuarios OFF;
                `);
        }
    }
}

async function backupUsuarios(usuarioIds, usuario_ejecutor) {
    const pool = await connectDB();
    const result = await pool.request()
        .query(`SELECT * FROM Usuarios WHERE id IN (${usuarioIds.join(',')})`);
    
    const backupResult = await pool.request()
        .input('tipo', 'usuario')
        .input('data_json', JSON.stringify(result.recordset))
        .input('usuario', usuario_ejecutor)
        .query(`
            INSERT INTO Backup_Eliminaciones (tipo, data_json, usuario_ejecutor)
            OUTPUT INSERTED.id
            VALUES (@tipo, @data_json, @usuario)
        `);
    return backupResult.recordset[0].id;
}

async function eliminarUsuarios(usuarioIds) {
    const pool = await connectDB();
    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
        const ids = usuarioIds.join(',');
        await new sql.Request(tx).query(`DELETE FROM UsuarioEmpresas WHERE usuario_id IN (${ids})`);
        await new sql.Request(tx).query(`DELETE FROM Usuarios WHERE id IN (${ids})`);
        await tx.commit();
        return true;
    } catch (err) {
        await tx.rollback();
        throw err;
    }
}

async function restaurarUsuarios(backupId) {
    const pool = await connectDB();
    const backup = await pool.request()
        .input('id', backupId)
        .query('SELECT data_json FROM Backup_Eliminaciones WHERE id = @id');
    
    if (!backup.recordset[0]) throw new Error('Backup no encontrado');
    
    const usuarios = JSON.parse(backup.recordset[0].data_json);
    for (const u of usuarios) {
        await pool.request()
            .input('id', u.id)
            .input('nombre', u.nombre)
            .input('email', u.email)
            .input('pass', u.password_hash)
            .input('rol', u.rol)
            .input('eid', u.empresa_id)
            .query(`
                SET IDENTITY_INSERT Usuarios ON;
                MERGE Usuarios AS target
                USING (VALUES (@id, @nombre, @email, @pass, @rol, @eid)) AS source (id, nombre, email, password_hash, rol, empresa_id)
                ON target.id = source.id
                WHEN MATCHED THEN
                    UPDATE SET nombre = source.nombre, email = source.email, rol = source.rol, empresa_id = source.empresa_id
                WHEN NOT MATCHED THEN
                    INSERT (id, nombre, email, password_hash, rol, empresa_id)
                    VALUES (source.id, source.nombre, source.email, source.password_hash, source.rol, source.empresa_id);
                SET IDENTITY_INSERT Usuarios OFF;
            `);
    }
}

async function obtenerBackups() {
    const pool = await connectDB();
    const result = await pool.request()
        .query('SELECT top 50 id, tipo, usuario_ejecutor, fecha_eliminacion FROM Backup_Eliminaciones ORDER BY fecha_eliminacion DESC');
    return result.recordset;
}

async function restaurarBackup(backupId) {
    const pool = await connectDB();
    const backup = await pool.request()
        .input('id', backupId)
        .query('SELECT tipo FROM Backup_Eliminaciones WHERE id = @id');
    
    if (!backup.recordset[0]) throw new Error('Backup no encontrado');
    
    const { tipo } = backup.recordset[0];
    if (tipo === 'empresa') {
        await restaurarEmpresas(backupId);
    } else if (tipo === 'usuario') {
        await restaurarUsuarios(backupId);
    } else {
        throw new Error('Tipo de backup desconocido');
    }
    
    // Opcional: Eliminar o marcar como restaurado
    return tipo;
}
async function obtenerLogsAuditoria({ tipo, fechaDesde, fechaHasta }) {
    const pool = await connectDB();
    let query = 'SELECT * FROM Auditoria WHERE 1=1';
    const request = pool.request();

    if (tipo) {
        query += ' AND accion LIKE @tipo';
        request.input('tipo', `%${tipo}%`);
    }
    if (fechaDesde) {
        query += ' AND timestamp >= @desde';
        request.input('desde', fechaDesde);
    }
    if (fechaHasta) {
        query += ' AND timestamp <= @hasta';
        request.input('hasta', fechaHasta);
    }

    query += ' ORDER BY timestamp DESC';
    const result = await request.query(query);
    return result.recordset;
}

/**
 * Obtiene métricas agregadas para el Dashboard de SuperAdmin (v1.29.2)
 */
async function obtenerMetricasGlobales() {
    const pool = await connectDB();
    
    // 1. Conteo total
    const totals = await pool.request().query(`
        SELECT 
            (SELECT COUNT(*) FROM Empresa) as totalEmpresas,
            (SELECT COUNT(*) FROM Usuarios) as totalUsuarios
    `);
    
    // 2. Distribución por planes
    const planDist = await pool.request().query(`
        SELECT p.nombre, COUNT(e.id) as count 
        FROM Planes p
        LEFT JOIN Empresa e ON e.plan_id = p.id
        GROUP BY p.nombre, p.id
    `);
    
    // 3. Últimas acciones de auditoría
    const recentLogs = await pool.request().query(`
        SELECT TOP 10 timestamp, accion, usuario_id, entidad_id 
        FROM Auditoria 
        ORDER BY timestamp DESC
    `);
    
    return {
        ...totals.recordset[0],
        distribucionPlanes: planDist.recordset,
        ultimasAcciones: recentLogs.recordset
    };
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
  obtenerDescripcionPlan,
  generarFeatureToggles,
  backupEmpresas,
  eliminarEmpresas,
  restaurarEmpresas,
  backupUsuarios,
  eliminarUsuarios,
  restaurarUsuarios,
  eliminarUsuariosPorEmpresa,
  eliminarSucursalesPorEmpresa,
  eliminarDepositosPorEmpresa,
  eliminarTransaccionalesPorEmpresa,
  eliminarMaestrosPorEmpresa,
  eliminarLogsPorEmpresa,
  obtenerLogsAuditoria,
  obtenerMetricasGlobales,
  obtenerBackups,
  restaurarBackup
};
