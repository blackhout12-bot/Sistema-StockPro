// src/modules/pos/pos.service.js
const { connectDB } = require('../../config/db');

async function getCajas(empresa_id) {
    const pool = await connectDB();
    const result = await pool.request()
        .input('empresa_id', empresa_id)
        .query(`SELECT * FROM POS_Cajas WHERE empresa_id = @empresa_id AND activa = 1`);
    
    // Si no hay cajas para esta empresa, creamos una "Caja Principal" por defecto
    if (result.recordset.length === 0) {
        const tx = await pool.request()
            .input('empresa_id', empresa_id)
            .query(`INSERT INTO POS_Cajas (empresa_id, nombre, activa) OUTPUT INSERTED.* VALUES (@empresa_id, 'Caja Principal', 1)`);
        return tx.recordset;
    }
    
    return result.recordset;
}

async function getSesionActiva(caja_id, usuario_id) {
    const pool = await connectDB();
    let query = `SELECT TOP 1 * FROM POS_Sesiones WHERE usuario_id = @usuario_id AND estado = 'ABIERTA'`;
    const req = pool.request().input('usuario_id', usuario_id);
    
    if (caja_id) {
        query += ` AND caja_id = @caja_id`;
        req.input('caja_id', caja_id);
    }
    
    query += ` ORDER BY id DESC`;
    
    const result = await req.query(query);
    return result.recordset[0] || null;
}

async function abrirSesion(caja_id, usuario_id, monto_inicial) {
    const pool = await connectDB();
    
    const activa = await getSesionActiva(caja_id, usuario_id);
    if (activa) throw new Error("Ya tienes una sesión abierta en esta o otra caja.");

    const result = await pool.request()
        .input('caja_id', caja_id)
        .input('usuario_id', usuario_id)
        .input('monto_inicial', monto_inicial)
        .query(`
            INSERT INTO POS_Sesiones (caja_id, usuario_id, monto_inicial, estado)
            OUTPUT INSERTED.*
            VALUES (@caja_id, @usuario_id, @monto_inicial, 'ABIERTA')
        `);
    return result.recordset[0];
}

async function cerrarSesion(sesion_id, usuario_id, monto_cierre) {
    const pool = await connectDB();
    const result = await pool.request()
        .input('sesion_id', sesion_id)
        .input('usuario_id', usuario_id)
        .input('monto_cierre', monto_cierre)
        .query(`
            UPDATE POS_Sesiones 
            SET estado = 'CERRADA', fecha_cierre = GETDATE(), monto_cierre = @monto_cierre
            OUTPUT INSERTED.*
            WHERE id = @sesion_id AND usuario_id = @usuario_id AND estado = 'ABIERTA'
        `);
    if (result.rowsAffected[0] === 0) throw new Error("Sesión no encontrada o ya está cerrada.");
    return result.recordset[0];
}

module.exports = {
  getCajas, getSesionActiva, abrirSesion, cerrarSesion
};
