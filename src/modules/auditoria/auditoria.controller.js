const express = require('express');
const router = express.Router();
const { connectDB } = require('../../config/db');
const withHealth = require('../../middlewares/health.middleware');

// Health Check por Módulo
router.use(withHealth('Auditoria'));
const auditoriaModel = require('./auditoria.model');

// GET /api/v1/auditoria -- Endpoint con filtros avanzados (solo administradores)
router.get('/', async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores pueden consultar la auditoría extendida.' });
    }
    
    // Extracción de filtros de coincidencia exacta / rangos
    const filtros = {
       limit: req.query.limit,
       fechaInicio: req.query.fechaInicio,
       fechaFin: req.query.fechaFin,
       usuario_id: req.query.usuario_id,
       entidad: req.query.entidad
    };
    
    const logs = await auditoriaModel.obtenerLogsAuditoria(req.tenant_id, filtros);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
