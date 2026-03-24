// src/modules/productos/productos.controller.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const authenticate = require('../../middlewares/auth');
const authorizeRole = require('../../middlewares/roles');
const checkPermiso = require('../../middlewares/rbac');
const requireFeature = require('../../middlewares/features');
const audit = require('../../middlewares/audit');
const { validateBody } = require('../../middlewares/validateRequest');
const { productoSchema, categoriaEsquemaSchema } = require('../../schemas/producto.schema');
const productosService = require('./productos.service');

// Configuración de Multer para imágenes de alta fidelidad
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './public/uploads/productos';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = file.originalname.split('.').pop() || 'png';
    cb(null, 'prod-' + uniqueSuffix + '.' + ext);
  }
});
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// ── GET /productos/categorias/esquemas ─────────
router.get('/categorias/esquemas', authenticate, async (req, res, next) => {
  try {
    const esquemas = await productosService.getCategoriasEsquemas(req.tenant_id);
    res.json(esquemas);
  } catch (err) {
    next(err);
  }
});

// ── POST /productos/categorias/esquemas ─────────
router.post('/categorias/esquemas', checkPermiso('productos', 'crear'), validateBody(categoriaEsquemaSchema), audit('crear', 'EsquemaCategoria'), async (req, res, next) => {
  try {
    const { nombre_rubro, icon, esquema_json } = req.body;
    const esquema = await productosService.crearCategoriaEsquema(req.tenant_id, nombre_rubro, icon || '📦', esquema_json);
    res.status(201).json(esquema);
  } catch (err) {
    next(err);
  }
});

// Listar productos con paginación server-side
router.get('/', checkPermiso('productos', 'leer'), async (req, res, next) => {
  try {
    const { page, limit, search, categoria, sucursal_id } = req.query;

    if (page !== undefined) {
      const resultado = await productosService.listarProductosPaginados({
        empresa_id: req.tenant_id,
        page: parseInt(page) || 1,
        limit: Math.min(parseInt(limit) || 20, 100),
        search: search || '',
        categoria: categoria || '',
        sucursal_id: sucursal_id || null,
      });
      return res.json(resultado);
    }

    const productos = await productosService.listarProductos(req.tenant_id, req.query.deposito_id, sucursal_id || null);
    res.json(productos);
  } catch (err) {
    next(err);
  }
});

// Crear producto
router.post('/crear', checkPermiso('productos', 'crear'), upload.single('imagen'), validateBody(productoSchema), audit('crear', 'Producto'), async (req, res, next) => {
  const { nombre, descripcion, precio, stock, categoria_id, sku, stock_min, stock_max, moneda_id, custom_fields, nro_lote, fecha_vto } = req.body;
  const image_url = req.file ? '/uploads/productos/' + req.file.filename : req.body.image_url;
  
  try {
    const producto = await productosService.agregarProducto(nombre, descripcion, precio, stock, categoria_id, req.tenant_id, req.user.id, sku, moneda_id, custom_fields, image_url, nro_lote, fecha_vto);
    res.locals.insertedId = producto.id;
    res.status(201).json(producto);
  } catch (err) {
    next(err);
  }
});

// Actualizar producto
router.put('/editar/:id', checkPermiso('productos', 'actualizar'), upload.single('imagen'), validateBody(productoSchema), audit('actualizar', 'Producto'), async (req, res, next) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, stock, categoria_id, sku, moneda_id, custom_fields } = req.body;
  const image_url = req.file ? '/uploads/productos/' + req.file.filename : req.body.image_url;

  try {
    const producto = await productosService.editarProducto(parseInt(id), nombre, descripcion, precio, stock, categoria_id, req.tenant_id, req.user.id, sku, moneda_id, custom_fields, image_url);
    res.json(producto);
  } catch (err) {
    next(err);
  }
});

// Eliminar producto
router.delete('/eliminar/:id', checkPermiso('productos', 'eliminar'), audit('eliminar', 'Producto'), async (req, res, next) => {
  const { id } = req.params;
  try {
    const resultado = await productosService.borrarProducto(parseInt(id), req.tenant_id);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
});

// Lotes...
router.get('/:id/lotes', checkPermiso('productos', 'leer'), requireFeature('mod_lotes'), async (req, res, next) => {
  try {
    const lotes = await productosService.getLotesByProducto(parseInt(req.params.id), req.tenant_id);
    res.json(lotes);
  } catch (error) { next(error); }
});

router.post('/:id/lotes', checkPermiso('productos', 'actualizar'), requireFeature('mod_lotes'), audit('crear', 'Lote'), async (req, res, next) => {
  try {
    const { nro_lote, cantidad, fecha_vto } = req.body;
    const lote = await productosService.agregarLote(parseInt(req.params.id), nro_lote, cantidad, fecha_vto, req.tenant_id);
    res.locals.insertedId = lote.id;
    res.status(201).json(lote);
  } catch (err) { next(err); }
});

// Precios por Sucursal
router.get('/:id/precios-sucursal', checkPermiso('productos', 'leer'), async (req, res, next) => {
  try {
    const precios = await productosService.getPreciosSucursal(parseInt(req.params.id));
    res.json(precios);
  } catch (err) { next(err); }
});

router.post('/:id/precios-sucursal', checkPermiso('productos', 'actualizar'), audit('actualizar', 'PrecioSucursal'), async (req, res, next) => {
  try {
    const { sucursal_id, precio } = req.body;
    await productosService.setPrecioSucursal(parseInt(req.params.id), parseInt(sucursal_id), parseFloat(precio), req.user.id);
    res.json({ success: true, message: 'Precio de sucursal actualizado' });
  } catch (err) { next(err); }
});

module.exports = router;
