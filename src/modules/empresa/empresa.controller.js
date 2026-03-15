// src/modules/empresa/empresa.controller.js
const express = require('express');
const router = express.Router();
const empresaService = require('./empresa.service');
const authenticate = require('../../middlewares/auth');
const checkPermiso = require('../../middlewares/rbac');
const { validateBody } = require('../../middlewares/validateRequest');
const audit = require('../../middlewares/audit');
const depositosController = require('./depositos.controller');
const {
    regionalSchema,
    brandingSchema,
    inventarioConfigSchema,
    impuestosConfigSchema,
    comprobanteSchema,
    integracionesSchema,
    dashboardConfigSchema
} = require('../../schemas/empresa.schema');

// ── GET /empresa — Datos de la empresa (Cualquier usuario con permiso) ──────────
router.get('/', checkPermiso('empresa', 'leer'), async (req, res, next) => {
    try {
        const empresa = await empresaService.getEmpresa(req.tenant_id);
        res.json(empresa);
    } catch (error) {
        next(error);
    }
});

// ── GET /empresa/configuracion/completa ───────────────────────────────────────
router.get('/configuracion/completa', checkPermiso('empresa', 'leer'), async (req, res, next) => {
    try {
        const empresa = await empresaService.getEmpresa(req.tenant_id);
        const comprobantes = await empresaService.getComprobantes(req.tenant_id);
        res.json({ ...empresa, comprobantes });
    } catch (error) {
        next(error);
    }
});

// ── GET /empresa/resumen — Métricas del tenant (Dashboard RBAC, renamed to avoid AdBlockers) ─────────────
router.get('/resumen', checkPermiso('dashboard', 'ver'), async (req, res, next) => {
    try {
        const stats = await empresaService.getEstadisticas(req.tenant_id);
        res.json(stats);
    } catch (error) {
        next(error);
    }
});

// ── PUT /empresa/configuracion/regional ───────────────────────────────────────
router.put('/configuracion/regional', checkPermiso('empresa', 'editar'), validateBody(regionalSchema), audit('actualizar_regional', 'Empresa'), async (req, res, next) => {
    try {
        const { razon_social, condicion_iva, moneda_principal, zona_horaria } = req.body;
        const cleanBody = { razon_social, condicion_iva, moneda_principal, zona_horaria };
        const empresa = await empresaService.updateConfiguracion(req.tenant_id, cleanBody);
        res.json(empresa);
    } catch (error) {
        next(error);
    }
});

// ── PUT /empresa/configuracion/branding ───────────────────────────────────────
router.put('/configuracion/branding', checkPermiso('empresa', 'editar'), validateBody(brandingSchema), audit('actualizar_branding', 'Empresa'), async (req, res, next) => {
    try {
        const { color_primario, color_secundario, logo_url } = req.body;
        const cleanBody = { color_primario, color_secundario, logo_url };
        const empresa = await empresaService.updateBranding(req.tenant_id, cleanBody);
        res.json(empresa);
    } catch (error) {
        next(error);
    }
});

// ── PUT /empresa/configuracion/inventario ─────────────────────────────────────
router.put('/configuracion/inventario', checkPermiso('empresa', 'editar'), validateBody(inventarioConfigSchema), audit('actualizar_inventario', 'Empresa'), async (req, res, next) => {
    try {
        const { permitir_stock_negativo, notificar_stock_minimo, metodo_costeo } = req.body;
        const cleanBody = { permitir_stock_negativo, notificar_stock_minimo, metodo_costeo };
        const empresa = await empresaService.updateInventarioConfig(req.tenant_id, cleanBody);
        res.json(empresa);
    } catch (error) {
        next(error);
    }
});

// ── PUT /empresa/configuracion/impuestos ──────────────────────────────────────
router.put('/configuracion/impuestos', checkPermiso('empresa', 'editar'), validateBody(impuestosConfigSchema), audit('actualizar_impuestos', 'Empresa'), async (req, res, next) => {
    try {
        const { iva_defecto, cuit, condicion_fiscal, percepciones_json, retenciones_json } = req.body;
        const cleanBody = { iva_defecto, cuit, condicion_fiscal, percepciones_json, retenciones_json };
        const empresa = await empresaService.updateImpuestosConfig(req.tenant_id, cleanBody);
        res.json(empresa);
    } catch (error) {
        next(error);
    }
});

// ── PUT /empresa/configuracion/integraciones ──────────────────────────────────
router.put('/configuracion/integraciones', checkPermiso('empresa', 'editar'), validateBody(integracionesSchema), audit('actualizar_integraciones', 'Empresa'), async (req, res, next) => {
    try {
        const empresa = await empresaService.updateIntegracionesConfig(req.tenant_id, req.body);
        res.json(empresa);
    } catch (error) {
        next(error);
    }
});

// ── PUT /empresa/configuracion/dashboard ─────────────────────────────────────
router.put('/configuracion/dashboard', checkPermiso('empresa', 'editar'), validateBody(dashboardConfigSchema), audit('actualizar_dashboard', 'Empresa'), async (req, res, next) => {
    try {
        const { kpis_visibles, rango_default, refresco_segundos, widgets_visibles } = req.body;
        const cleanBody = { kpis_visibles, rango_default, refresco_segundos, widgets_visibles };
        const empresa = await empresaService.updateDashboardConfig(req.tenant_id, cleanBody);
        res.json(empresa);
    } catch (error) {
        next(error);
    }
});

// ── GET /empresa/configuracion/comprobantes ────────────────────────────────────
router.get('/configuracion/comprobantes', checkPermiso('empresa', 'leer'), async (req, res, next) => {
    try {
        const comprobantes = await empresaService.getComprobantes(req.tenant_id);
        res.json(comprobantes);
    } catch (error) {
        next(error);
    }
});

// ── POST /empresa/configuracion/comprobantes ───────────────────────────────────
router.post('/configuracion/comprobantes', checkPermiso('empresa', 'editar'), validateBody(comprobanteSchema), audit('crear', 'ConfigComprobante'), async (req, res, next) => {
    try {
        const nuevo = await empresaService.createComprobante(req.tenant_id, req.body);
        res.status(201).json(nuevo);
    } catch (error) {
        next(error);
    }
});

// ── PUT /empresa/configuracion/comprobantes/:id ───────────────────────────────
router.put('/configuracion/comprobantes/:id', checkPermiso('empresa', 'editar'), validateBody(comprobanteSchema), audit('actualizar', 'ConfigComprobante'), async (req, res, next) => {
    try {
        await empresaService.updateComprobante(req.tenant_id, req.params.id, req.body);
        res.json({ message: 'Configuración de comprobante actualizada' });
    } catch (error) {
        next(error);
    }
});

// ── RUTAS DE DEPÓSITOS (MULTI-ALMACÉN) ──────────────────────────────────────────
router.get('/configuracion/depositos', checkPermiso('empresa', 'leer'), depositosController.listar);
router.get('/configuracion/depositos/:deposito_id', checkPermiso('empresa', 'leer'), depositosController.obtener);
router.post('/configuracion/depositos', checkPermiso('empresa', 'editar'), audit('crear', 'Deposito'), depositosController.crear);
router.put('/configuracion/depositos/:deposito_id', checkPermiso('empresa', 'editar'), audit('actualizar', 'Deposito'), depositosController.actualizar);
router.delete('/configuracion/depositos/:deposito_id', checkPermiso('empresa', 'editar'), audit('eliminar', 'Deposito'), depositosController.eliminar);

// ── PUT /empresa — Actualizar perfil básico (RBAC) ───────────────────────────
router.put('/', checkPermiso('empresa', 'editar'), audit('actualizar', 'Empresa'), async (req, res, next) => {
    try {
        const { nombre, documento_identidad } = req.body;
        if (!nombre || !documento_identidad) {
            return res.status(400).json({ error: 'Nombre y Documento de Identidad son obligatorios' });
        }
        const updatedEmpresa = await empresaService.updateEmpresa(req.tenant_id, req.body);
        res.json(updatedEmpresa);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
