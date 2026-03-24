const { sql, connectDB } = require('../../config/db');

async function obtenerLogsAuditoria(empresa_id, filtros) {
  const { limit = 100, fechaInicio, fechaFin, usuario_id, entidad } = filtros;
  
  const pool = await connectDB();
  let queryStr = `
    SELECT TOP (@limit)
      al.id,
      al.accion,
      al.entidad,
      al.entidad_id,
      al.valor_anterior,
      al.valor_nuevo,
      al.ip,
      al.timestamp AS fecha,
      u.nombre AS usuario_nombre,
      u.email AS usuario_email
    FROM dbo.Auditoria al
    LEFT JOIN Usuarios u ON al.usuario_id = u.id
    WHERE al.empresa_id = @empresa_id
  `;
  
  const request = pool.request();
  request.input('empresa_id', sql.Int, empresa_id);
  request.input('limit', sql.Int, parseInt(limit, 10) || 100);
  
  if (fechaInicio) {
    queryStr += ` AND al.timestamp >= @fechaInicio`;
    request.input('fechaInicio', sql.DateTime, new Date(fechaInicio));
  }
  if (fechaFin) {
    queryStr += ` AND al.timestamp <= @fechaFin`;
    const fFin = new Date(fechaFin);
    fFin.setHours(23, 59, 59, 999);
    request.input('fechaFin', sql.DateTime, fFin);
  }
  if (usuario_id) {
    queryStr += ` AND al.usuario_id = @usuario_id`;
    request.input('usuario_id', sql.Int, parseInt(usuario_id, 10));
  }
  if (entidad) {
    queryStr += ` AND al.entidad = @entidad`;
    request.input('entidad', sql.NVarChar, entidad);
  }

  queryStr += ` ORDER BY al.timestamp DESC`;

  const result = await request.query(queryStr);
  return result.recordset;
}

module.exports = {
  obtenerLogsAuditoria
};
