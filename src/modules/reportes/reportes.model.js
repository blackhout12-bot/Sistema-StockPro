// src/modules/reportes/reportes.model.js
const { sql, connectDB } = require('../../config/db');

/**
 * Devuelve el stock actual de todos los productos de la empresa.
 * Nota: la columna en DB es `stock` (no `stock_actual`).
 */
async function obtenerStockActual(empresa_id) {
  const pool = await connectDB();
  const result = await pool.request()
    .input('empresa_id', sql.Int, empresa_id)
    .query(`
      SELECT
        p.id,
        p.nombre,
        p.descripcion,
        p.precio,
        p.stock
      FROM Productos p
      WHERE p.empresa_id = @empresa_id
    `);
  return result.recordset;
}

/**
 * Movimientos en un rango de fechas.
 * La tabla Movimientos usa camelCase: productoId, usuarioId.
 */
async function obtenerMovimientosPorFechas(fechaInicio, fechaFin, empresa_id) {
  const pool = await connectDB();
  const result = await pool.request()
    .input('fechaInicio', sql.DateTime, new Date(fechaInicio))
    .input('fechaFin', sql.DateTime, new Date(new Date(fechaFin).setHours(23, 59, 59, 999)))
    .input('empresa_id', sql.Int, empresa_id)
    .query(`
      SELECT
        m.id,
        m.productoId AS producto_id,
        p.nombre AS producto,
        m.tipo,
        m.cantidad,
        m.usuarioId AS usuario_id,
        u.nombre AS usuario,
        m.fecha
      FROM Movimientos m
      INNER JOIN Productos p ON m.productoId = p.id
      LEFT JOIN Usuarios u ON m.usuarioId = u.id
      WHERE m.fecha BETWEEN @fechaInicio AND @fechaFin
        AND m.empresa_id = @empresa_id
      ORDER BY m.fecha ASC
    `);
  return result.recordset;
}

/**
 * Total de ventas (salidas) en un rango de fechas.
 */
async function obtenerVentasTotales(fechaInicio, fechaFin, empresa_id) {
  const pool = await connectDB();
  const result = await pool.request()
    .input('fechaInicio', sql.DateTime, new Date(fechaInicio))
    .input('fechaFin', sql.DateTime, new Date(new Date(fechaFin).setHours(23, 59, 59, 999)))
    .input('empresa_id', sql.Int, empresa_id)
    .query(`
      SELECT
        ISNULL(SUM(f.total * ISNULL(f.tipo_cambio, 1)), 0) AS ventas_totales
      FROM Facturas f
      WHERE f.fecha_emision BETWEEN @fechaInicio AND @fechaFin
        AND f.empresa_id = @empresa_id
        AND f.estado != 'anulada'
    `);
  return result.recordset[0];
}

/**
 * Ventas agrupadas por producto en un rango de fechas.
 */
async function obtenerVentasPorProducto(fechaInicio, fechaFin, empresa_id) {
  const pool = await connectDB();
  const result = await pool.request()
    .input('fechaInicio', sql.DateTime, new Date(fechaInicio))
    .input('fechaFin', sql.DateTime, new Date(new Date(fechaFin).setHours(23, 59, 59, 999)))
    .input('empresa_id', sql.Int, empresa_id)
    .query(`
      SELECT
        p.id,
        p.nombre,
        SUM(df.cantidad) AS cantidad_vendida,
        SUM(df.subtotal * ISNULL(f.tipo_cambio, 1)) AS total_ventas
      FROM Detalle_Facturas df
      INNER JOIN Facturas f ON df.factura_id = f.id
      INNER JOIN Productos p ON df.producto_id = p.id
      WHERE f.fecha_emision BETWEEN @fechaInicio AND @fechaFin
        AND f.empresa_id = @empresa_id
        AND f.estado != 'anulada'
      GROUP BY p.id, p.nombre
      ORDER BY total_ventas DESC
    `);
  return result.recordset;
}

module.exports = {
  obtenerStockActual,
  obtenerMovimientosPorFechas,
  obtenerVentasTotales,
  obtenerVentasPorProducto
};
