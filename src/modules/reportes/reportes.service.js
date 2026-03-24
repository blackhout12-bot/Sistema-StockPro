// src/modules/reportes/reportes.service.js
const reportesModel = require('./reportes.model');

async function generarReporteStock(empresa_id) {
  return await reportesModel.obtenerStockActual(empresa_id);
}

async function generarReporteMovimientos(fechaInicio, fechaFin, empresa_id) {
  return await reportesModel.obtenerMovimientosPorFechas(fechaInicio, fechaFin, empresa_id);
}

async function generarReporteVentas(fechaInicio, fechaFin, empresa_id) {
  return await reportesModel.obtenerVentasTotales(fechaInicio, fechaFin, empresa_id);
}

async function generarReporteVentasPorProducto(fechaInicio, fechaFin, empresa_id) {
  return await reportesModel.obtenerVentasPorProducto(fechaInicio, fechaFin, empresa_id);
}

module.exports = {
  generarReporteStock,
  generarReporteMovimientos,
  generarReporteVentas,
  generarReporteVentasPorProducto
};
