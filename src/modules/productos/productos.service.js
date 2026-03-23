// src/modules/productos/productos.service.js
const { connectDB } = require('../../config/db');
const productoRepository = require('../../repositories/producto.repository');
const loteRepository = require('../../repositories/lote.repository');
const eventBus = require('../../events/eventBus');

async function listarProductos(empresa_id, deposito_id) {
  const pool = await connectDB();
  return await productoRepository.getAll(pool, empresa_id, deposito_id);
}

async function listarProductosPaginados({ empresa_id, page, limit, search, categoria }) {
  const pool = await connectDB();
  return await productoRepository.getPaginated(pool, { empresa_id, page, limit, search, categoria });
}

async function agregarProducto(nombre, descripcion, precio, stock, categoria, empresa_id, usuario_id, sku, moneda_id, custom_fields, image_url, nro_lote, fecha_vto) {
  const pool = await connectDB();
  // Forzamos "stock: 0" inicial para evitar doble contabilización en DB. El Movimiento hará el ingreso real sumando el stock automáticamente.
  const insertId = await productoRepository.create(pool, { nombre, descripcion, precio, stock: 0, categoria, sku, moneda_id, custom_fields, image_url }, empresa_id);
  
  if (stock > 0) {
      const movimientosService = require('../movimientos/movimientos.service');
      await movimientosService.agregarMovimiento({
          productoId: insertId,
          tipo: 'entrada',
          cantidad: stock,
          nro_lote,
          fecha_vto,
          motivo: 'Inventario Inicial Asignado'
      }, usuario_id, empresa_id);
  } else {
    eventBus.emit('STOCK_BAJO', {
      producto_id: insertId,
      nombre,
      stock,
      empresa_id,
      categoria, 
      mensaje: `Producto nuevo creado sin inventario (${stock})`
    });
  }
  
  return { id: insertId, nombre, descripcion, precio, stock, categoria, sku, moneda_id, custom_fields, image_url };
}

async function editarProducto(id, nombre, descripcion, precio, stockNuevo, categoria, empresa_id, usuario_id, sku, moneda_id, custom_fields, image_url) {
  const pool = await connectDB();
  const existing = await productoRepository.getById(pool, id, empresa_id);
  
  // Reinyectamos el stock antiguo para que el update de producto no lo sobrescriba de forma cruda.
  await productoRepository.update(pool, id, { nombre, descripcion, precio, stock: existing.stock, categoria, sku, moneda_id, custom_fields, image_url }, empresa_id);
  
  const diff = stockNuevo - existing.stock;
  if (diff !== 0) {
      const movimientosService = require('../movimientos/movimientos.service');
      await movimientosService.agregarMovimiento({
          productoId: id,
          tipo: diff > 0 ? 'entrada' : 'ajuste_salida',
          cantidad: Math.abs(diff),
          motivo: 'Ajuste Inyectado vía Edición de Producto'
      }, usuario_id, empresa_id);
  }

  return { id, nombre, descripcion, precio, stock: stockNuevo, categoria, sku, moneda_id, custom_fields, image_url };
}

async function borrarProducto(id, empresa_id) {
  const pool = await connectDB();
  return await productoRepository.delete(pool, id, empresa_id);
}

async function agregarLote(producto_id, nro_lote, cantidad, fecha_vto, empresa_id) {
  const pool = await connectDB();
  try { await pool.request().query("SELECT TOP 1 1 FROM Lotes"); } catch (e) {
    throw new Error("El módulo de lotes aún no está migrado o accesible en la base de datos.");
  }
  return await loteRepository.create(pool, { producto_id, nro_lote, cantidad, fecha_vto }, empresa_id);
}

async function getLotesByProducto(producto_id, empresa_id) {
  const pool = await connectDB();
  return await loteRepository.getLotes(pool, producto_id, empresa_id);
}

// ── Lógica EAV (Categorias_Esquemas) ──────────────────────────
async function getCategoriasEsquemas(empresa_id) {
  const pool = await connectDB();
  const result = await pool.request()
    .input('empresa_id', empresa_id)
    .query(`SELECT * FROM Categorias_Esquemas WHERE empresa_id = @empresa_id AND activo = 1 ORDER BY nombre_rubro ASC`);
  
  return result.recordset.map(row => ({
    ...row,
    esquema_json: typeof row.esquema_json === 'string' ? JSON.parse(row.esquema_json) : row.esquema_json
  }));
}

async function crearCategoriaEsquema(empresa_id, nombre_rubro, icon, esquema_json) {
  const pool = await connectDB();
  const jsonStr = typeof esquema_json === 'string' ? esquema_json : JSON.stringify(esquema_json || {});
  const result = await pool.request()
    .input('empresa_id', empresa_id)
    .input('nombre_rubro', nombre_rubro)
    .input('icon', icon)
    .input('esquema_json', jsonStr)
    .query(
    `INSERT INTO Categorias_Esquemas (empresa_id, nombre_rubro, icon, esquema_json) 
     OUTPUT INSERTED.id 
     VALUES (@empresa_id, @nombre_rubro, @icon, @esquema_json)`
  );
  return { id: result.recordset[0].id, empresa_id, nombre_rubro, icon, esquema_json: jsonStr };
}

module.exports = {
  listarProductos,
  listarProductosPaginados,
  agregarProducto,
  editarProducto,
  borrarProducto,
  agregarLote,
  getLotesByProducto,
  getCategoriasEsquemas,
  crearCategoriaEsquema
};
