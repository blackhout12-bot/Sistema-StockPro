// src/modules/productos/productos.controller.js
const express = require('express');
const router = express.Router();
const authenticate = require('../../middlewares/auth');
const authorizeRole = require('../../middlewares/roles');
const checkPermiso = require('../../middlewares/rbac');
const requireFeature = require('../../middlewares/features');
const audit = require('../../middlewares/audit');
const { validateBody } = require('../../middlewares/validateRequest');
const { productoSchema } = require('../../schemas/producto.schema');
const productosService = require('./productos.service');

// Listar productos con paginación server-side (GET /?page=1&limit=20&search=...&categoria=...)
// Si no se pasa 'page', devuelve todos (retrocompatibilidad con facturación/movimientos)
router.get('/', checkPermiso('productos', 'leer'), async (req, res, next) => {
  try {
    const { page, limit, search, categoria } = req.query;

    // Si se envía el parámetro `page`, usar paginación
    if (page !== undefined) {
      const resultado = await productosService.listarProductosPaginados({
        empresa_id: req.tenant_id,
        page: parseInt(page) || 1,
        limit: Math.min(parseInt(limit) || 20, 100), // max 100 por página
        search: search || '',
        categoria: categoria || '',
      });
      return res.json(resultado);
    }

    // Sin paginación: devuelve todos (necesario para facturación/movimientos)
    const productos = await productosService.listarProductos(req.tenant_id);
    res.json(productos);
  } catch (err) {
    next(err);
  }
});

// Crear producto (solo admin)
router.post('/crear', checkPermiso('productos', 'crear'), validateBody(productoSchema), audit('crear', 'Producto'), async (req, res, next) => {
  const { nombre, descripcion, precio, stock, categoria, sku, stock_min, stock_max, moneda_id, custom_fields } = req.body;
  try {
    const producto = await productosService.agregarProducto(nombre, descripcion, precio, stock, categoria, req.tenant_id, sku, moneda_id, custom_fields);
    res.locals.insertedId = producto.id; // Para el audit log
    res.status(201).json(producto);
  } catch (err) {
    next(err);
  }
});

// Actualizar producto (solo admin)
router.put('/editar/:id', checkPermiso('productos', 'editar'), validateBody(productoSchema), audit('actualizar', 'Producto'), async (req, res, next) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, stock, categoria, sku, moneda_id, custom_fields } = req.body;
  try {
    const producto = await productosService.editarProducto(parseInt(id), nombre, descripcion, precio, stock, categoria, req.tenant_id, sku, moneda_id, custom_fields);
    res.json(producto);
  } catch (err) {
    next(err);
  }
});

// Eliminar producto (solo admin)
router.delete('/eliminar/:id', checkPermiso('productos', 'eliminar'), audit('eliminar', 'Producto'), async (req, res, next) => {
  const { id } = req.params;
  try {
    const resultado = await productosService.borrarProducto(parseInt(id), req.tenant_id);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
});

// Obtener lotes de un producto
// ── GET /productos/:id/lotes ─────────
router.get('/:id/lotes', checkPermiso('productos', 'leer'), requireFeature('mod_lotes'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const lotes = await productosService.getLotesByProducto(parseInt(id), req.tenant_id);
    res.json(lotes);
  } catch (error) {
    next(error);
  }
});

// Agregar lote
// ── POST /productos/:id/lotes ────────
router.post('/:id/lotes', checkPermiso('productos', 'editar'), requireFeature('mod_lotes'), audit('crear', 'Lote'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nro_lote, cantidad, fecha_vto } = req.body;
    const lote = await productosService.agregarLote(parseInt(id), nro_lote, cantidad, fecha_vto, req.tenant_id);
    res.locals.insertedId = lote.id;
    res.status(201).json(lote);
  } catch (err) {
    next(err);
  }
});

module.exports = router;


