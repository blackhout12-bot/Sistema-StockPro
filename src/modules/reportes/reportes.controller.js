const express = require('express');
const router = express.Router();
const authenticate = require('../../middlewares/auth');
const checkPermiso = require('../../middlewares/rbac');
const reportesService = require('./reportes.service');
const reportesExcelService = require('./reportes_excel.service');
const reportesPdfService = require('./reportes_pdf.service');

/** Devuelve fechas por defecto: inicio del mes actual hasta hoy */
function defaultDateRange(fechaInicio, fechaFin) {
  const hoy = new Date();
  const inicio = fechaInicio ? new Date(fechaInicio) : new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const fin = fechaFin ? new Date(fechaFin) : hoy;

  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    throw new Error('Fechas inválidas. Usar formato YYYY-MM-DD');
  }
  return { inicio, fin };
}

// GET /reportes/stock — stock actual de todos los productos
router.get('/stock', checkPermiso('reportes', 'leer'), async (req, res) => {
  try {
    const reporte = await reportesService.generarReporteStock(req.tenant_id);
    res.json(reporte);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /reportes/movimientos?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
router.get('/movimientos', checkPermiso('reportes', 'leer'), async (req, res) => {
  try {
    const { inicio, fin } = defaultDateRange(req.query.fechaInicio, req.query.fechaFin);
    const reporte = await reportesService.generarReporteMovimientos(inicio, fin, req.tenant_id);
    res.json(reporte);
  } catch (err) {
    res.status(err.message.includes('inválidas') ? 400 : 500).json({ error: err.message });
  }
});

// GET /reportes/ventas?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
router.get('/ventas', checkPermiso('reportes', 'leer'), async (req, res) => {
  try {
    const { inicio, fin } = defaultDateRange(req.query.fechaInicio, req.query.fechaFin);
    const reporte = await reportesService.generarReporteVentas(inicio, fin, req.tenant_id);
    res.json(reporte);
  } catch (err) {
    res.status(err.message.includes('inválidas') ? 400 : 500).json({ error: err.message });
  }
});

// GET /reportes/ventas-producto?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
router.get('/ventas-producto', checkPermiso('reportes', 'leer'), async (req, res) => {
  try {
    const { inicio, fin } = defaultDateRange(req.query.fechaInicio, req.query.fechaFin);
    const reporte = await reportesService.generarReporteVentasPorProducto(inicio, fin, req.tenant_id);
    res.json(reporte);
  } catch (err) {
    res.status(err.message.includes('inválidas') ? 400 : 500).json({ error: err.message });
  }
});

// GET /reportes/auditoria — logs de acciones críticas
router.get('/auditoria', checkPermiso('reportes', 'leer'), async (req, res) => {
  try {
    const { limit } = req.query;
    const reporte = await reportesService.generarReporteAuditoria(req.tenant_id, parseInt(limit) || 100);
    res.json(reporte);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── NUEVOS ENDPOINTS PARA EXPORTACIONES AVANZADAS (Excel/PDF) ───

// GET /reportes/ventas/excel
router.get('/ventas/excel', checkPermiso('reportes', 'exportar'), async (req, res) => {
  try {
    const { inicio, fin } = defaultDateRange(req.query.fechaInicio, req.query.fechaFin);
    const buffer = await reportesExcelService.generarExcelVentas(inicio, fin, req.tenant_id);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=ventas.xlsx');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /reportes/cuentas-pagar/excel
router.get('/cuentas-pagar/excel', checkPermiso('reportes', 'exportar'), async (req, res) => {
  try {
    const buffer = await reportesExcelService.generarExcelCuentasPagar(req.tenant_id);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=cuentas_pagar.xlsx');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /reportes/kardex/pdf
router.get('/kardex/pdf', checkPermiso('reportes', 'exportar'), async (req, res) => {
  try {
    const buffer = await reportesPdfService.generarKardexPdf(req.tenant_id, req.empresa_nombre || 'StockPro ERP');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=kardex_valorizado.pdf');
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
