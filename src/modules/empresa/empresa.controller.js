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
    dashboardConfigSchema,
    featureTogglesSchema
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
router.get('/resumen', checkPermiso('dashboard', 'leer'), async (req, res, next) => {
    try {
        const stats = await empresaService.getEstadisticas(req.tenant_id);
        res.json(stats);
    } catch (error) {
        next(error);
    }
});

// ── PUT /empresa/configuracion/regional ───────────────────────────────────────
router.put('/configuracion/regional', checkPermiso('empresa', 'actualizar'), validateBody(regionalSchema), audit('actualizar_regional', 'Empresa'), async (req, res, next) => {
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
router.put('/configuracion/branding', checkPermiso('empresa', 'actualizar'), validateBody(brandingSchema), audit('actualizar_branding', 'Empresa'), async (req, res, next) => {
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
router.put('/configuracion/inventario', checkPermiso('empresa', 'actualizar'), validateBody(inventarioConfigSchema), audit('actualizar_inventario', 'Empresa'), async (req, res, next) => {
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
router.put('/configuracion/impuestos', checkPermiso('empresa', 'actualizar'), validateBody(impuestosConfigSchema), audit('actualizar_impuestos', 'Empresa'), async (req, res, next) => {
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
router.put('/configuracion/integraciones', checkPermiso('empresa', 'actualizar'), validateBody(integracionesSchema), audit('actualizar_integraciones', 'Empresa'), async (req, res, next) => {
    try {
        const empresa = await empresaService.updateIntegracionesConfig(req.tenant_id, req.body);
        res.json(empresa);
    } catch (error) {
        next(error);
    }
});

// ── PUT /empresa/configuracion/dashboard ─────────────────────────────────────
router.put('/configuracion/dashboard', checkPermiso('empresa', 'actualizar'), validateBody(dashboardConfigSchema), audit('actualizar_dashboard', 'Empresa'), async (req, res, next) => {
    try {
        const { kpis_visibles, rango_default, refresco_segundos, widgets_visibles } = req.body;
        const cleanBody = { kpis_visibles, rango_default, refresco_segundos, widgets_visibles };
        const empresa = await empresaService.updateDashboardConfig(req.tenant_id, cleanBody);
        res.json(empresa);
    } catch (error) {
        next(error);
    }
});

// ── PUT /empresa/configuracion/features ───────────────────────────────────────
router.put('/configuracion/features', checkPermiso('empresa', 'actualizar'), validateBody(featureTogglesSchema), audit('actualizar_features', 'Empresa'), async (req, res, next) => {
    try {
        const empresa = await empresaService.updateFeatureToggles(req.tenant_id, req.body);
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
router.post('/configuracion/comprobantes', checkPermiso('empresa', 'actualizar'), validateBody(comprobanteSchema), audit('crear', 'ConfigComprobante'), async (req, res, next) => {
    try {
        const nuevo = await empresaService.createComprobante(req.tenant_id, req.body);
        res.status(201).json(nuevo);
    } catch (error) {
        next(error);
    }
});

// ── PUT /empresa/configuracion/comprobantes/:id ───────────────────────────────
router.put('/configuracion/comprobantes/:id', checkPermiso('empresa', 'actualizar'), validateBody(comprobanteSchema), audit('actualizar', 'ConfigComprobante'), async (req, res, next) => {
    try {
        await empresaService.updateComprobante(req.tenant_id, req.params.id, req.body);
        res.json({ message: 'Configuración de comprobante actualizada' });
    } catch (error) {
        next(error);
    }
});

// ── RUTAS DE SUCURSALES (MULTI-SUCURSAL) ──────────────────────────────────────────
router.get('/sucursales', checkPermiso('empresa', 'leer'), async (req, res, next) => {
    try {
        const pool = await require('../../config/db').connectDB();
        const result = await pool.request()
            .input('empresa_id', req.tenant_id)
            .query('SELECT * FROM Sucursales WHERE empresa_id = @empresa_id AND activa = 1');
        res.json(result.recordset);
    } catch (err) { next(err); }
});

router.post('/sucursales', checkPermiso('empresa', 'crear'), audit('crear', 'Sucursal'), async (req, res, next) => {
    try {
        const { nombre, direccion, telefono } = req.body;
        const pool = await require('../../config/db').connectDB();
        const result = await pool.request()
            .input('empresa_id', req.tenant_id)
            .input('nombre', nombre)
            .input('direccion', direccion || null)
            .input('telefono', telefono || null)
            .query(`
                INSERT INTO Sucursales (empresa_id, nombre, direccion, telefono, activa)
                OUTPUT INSERTED.*
                VALUES (@empresa_id, @nombre, @direccion, @telefono, 1)
            `);
        res.status(201).json(result.recordset[0]);
    } catch (err) { next(err); }
});

// ── RUTAS DE DEPÓSITOS (MULTI-ALMACÉN) ──────────────────────────────────────────
router.get('/configuracion/depositos', checkPermiso('empresa', 'leer'), depositosController.listar);
router.get('/configuracion/depositos/:deposito_id', checkPermiso('empresa', 'leer'), depositosController.obtener);
router.post('/configuracion/depositos', checkPermiso('empresa', 'actualizar'), audit('crear', 'Deposito'), depositosController.crear);
router.put('/configuracion/depositos/:deposito_id', checkPermiso('empresa', 'actualizar'), audit('actualizar', 'Deposito'), depositosController.actualizar);
router.delete('/configuracion/depositos/:deposito_id', checkPermiso('empresa', 'actualizar'), audit('eliminar', 'Deposito'), depositosController.eliminar);

// ── PUT /empresa — Actualizar perfil básico (RBAC) ───────────────────────────
router.put('/', checkPermiso('empresa', 'actualizar'), audit('actualizar', 'Empresa'), async (req, res, next) => {
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

// ── ROLES DINÁMICOS ──────────
const { rolSchema } = require('../../schemas/rol.schema');

router.get('/roles', checkPermiso('empresa', 'leer'), async (req, res, next) => {
    try {
        const pool = await require('../../config/db').connectDB();
        const result = await pool.request()
            .input('empresa_id', req.tenant_id)
            .query('SELECT * FROM Roles WHERE empresa_id = @empresa_id AND activo = 1');
        res.json(result.recordset);
    } catch (err) { next(err); }
});

router.post('/roles', checkPermiso('empresa', 'crear'), validateBody(rolSchema), audit('crear', 'Rol'), async (req, res, next) => {
    try {
        const { nombre, codigo_rol, permisos } = req.body;
        const pool = await require('../../config/db').connectDB();
        
        const result = await pool.request()
            .input('empresa_id', req.tenant_id)
            .input('nombre', nombre)
            .input('codigo_rol', codigo_rol)
            .input('permisos', JSON.stringify(permisos || {}))
            .query(`
                INSERT INTO Roles (empresa_id, nombre, codigo_rol, permisos)
                OUTPUT INSERTED.*
                VALUES (@empresa_id, @nombre, @codigo_rol, @permisos)
            `);
        res.status(201).json(result.recordset[0]);
    } catch (err) { next(err); }
});

router.put('/roles/:id', checkPermiso('empresa', 'actualizar'), validateBody(rolSchema), audit('actualizar', 'Rol'), async (req, res, next) => {
    try {
        const { nombre, codigo_rol, permisos, activo } = req.body;
        const pool = await require('../../config/db').connectDB();
        
        // No permitir modificar roles de sistema
        const check = await pool.request().input('id', req.params.id).input('empresa_id', req.tenant_id)
            .query('SELECT es_sistema FROM Roles WHERE id = @id AND empresa_id = @empresa_id');
        if (!check.recordset.length) return res.status(404).json({ error: 'Rol no encontrado' });
        
        const esSistema = check.recordset[0].es_sistema;
        
        let q = `UPDATE Roles SET permisos = @permisos`;
        if (activo !== undefined && !esSistema) q += `, activo = @activo`;
        if (nombre !== undefined && !esSistema) q += `, nombre = @nombre`;
        if (codigo_rol !== undefined && !esSistema) q += `, codigo_rol = @codigo_rol`;
        q += ` OUTPUT INSERTED.* WHERE id = @id AND empresa_id = @empresa_id`;

        const result = await pool.request()
            .input('id', req.params.id)
            .input('empresa_id', req.tenant_id)
            .input('nombre', nombre)
            .input('codigo_rol', codigo_rol)
            .input('activo', activo)
            .input('permisos', JSON.stringify(permisos || {}))
            .query(q);
            
        res.json(result.recordset[0]);
    } catch (err) { next(err); }
});

router.delete('/roles/:id', checkPermiso('empresa', 'eliminar'), audit('eliminar', 'Rol'), async (req, res, next) => {
    try {
        const pool = await require('../../config/db').connectDB();
        const check = await pool.request().input('id', req.params.id).input('empresa_id', req.tenant_id)
            .query('SELECT es_sistema FROM Roles WHERE id = @id AND empresa_id = @empresa_id');
        if (!check.recordset.length) return res.status(404).json({ error: 'Rol no encontrado' });
        if (check.recordset[0].es_sistema) return res.status(400).json({ error: 'No de puede eliminar un rol del sistema' });
        
        await pool.request()
            .input('id', req.params.id)
            .input('empresa_id', req.tenant_id)
            .query('UPDATE Roles SET activo = 0 WHERE id = @id AND empresa_id = @empresa_id');
        res.status(204).send();
    } catch (err) { next(err); }
});

module.exports = router;
