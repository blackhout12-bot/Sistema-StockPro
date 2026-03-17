// src/modules/productos/productos.service.js
const { connectDB } = require('../../config/db');
const productoRepository = require('../../repositories/producto.repository');
const loteRepository = require('../../repositories/lote.repository');

async function listarProductos(empresa_id) {
  const pool = await connectDB();
  return await productoRepository.getAll(pool, empresa_id);
}

async function listarProductosPaginados({ empresa_id, page, limit, search, categoria }) {
  const pool = await connectDB();
  return await productoRepository.getPaginated(pool, { empresa_id, page, limit, search, categoria });
}

async function agregarProducto(nombre, descripcion, precio, stock, categoria, empresa_id, sku, moneda_id, custom_fields) {
  const pool = await connectDB();
  const insertId = await productoRepository.create(pool, { nombre, descripcion, precio, stock, categoria, sku, moneda_id, custom_fields }, empresa_id);
  // Opcionalmente retornar el producto insertado si el controlador lo requiere
  return await productoRepository.getById(pool, insertId, empresa_id);
}

async function editarProducto(id, nombre, descripcion, precio, stock, categoria, empresa_id, sku, moneda_id, custom_fields) {
  const pool = await connectDB();
  await productoRepository.update(pool, id, { nombre, descripcion, precio, stock, categoria, sku, moneda_id, custom_fields }, empresa_id);
  return await productoRepository.getById(pool, id, empresa_id);
}

async function borrarProducto(id, empresa_id) {
  const pool = await connectDB();
  await productoRepository.delete(pool, id, empresa_id);
}

// NUEVO: Funciones para Lotes integradas con Repository pattern
async function getLotesByProducto(producto_id, empresa_id) {
  const pool = await connectDB();
  return await loteRepository.getAllByProducto(pool, producto_id, empresa_id);
}

async function agregarLote(producto_id, nro_lote, cantidad, fecha_vto, empresa_id) {
  const pool = await connectDB();

  // Validar si la tabla Lotes existe (por si falla la migración en db sucia)
  try {
    await pool.request().query("SELECT TOP 1 1 FROM Lotes");
  } catch (e) {
    throw new Error("El módulo de lotes aún no está migrado o accesible en la base de datos.");
  }

  return await loteRepository.create(pool, { producto_id, nro_lote, cantidad, fecha_vto }, empresa_id);
}

module.exports = {
  listarProductos,
  listarProductosPaginados,
  agregarProducto,
  editarProducto,
  borrarProducto,
  getLotesByProducto,
  agregarLote
};
