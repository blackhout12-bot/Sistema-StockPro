const movimientoRepository = require('../../repositories/movimiento.repository');
const { deleteCache } = require('../../config/redis');
const { notifyEvent } = require('../../utils/webhook.service');
const meliService = require('../../utils/mercadolibre.service');
const { connectDB, sql } = require('../../config/db');
const logger = require('../../utils/logger');

async function listarMovimientos(empresa_id) {
  return await movimientoRepository.getAll(empresa_id);
}

async function agregarMovimiento(data, usuarioId, empresa_id) {
  const result = await movimientoRepository.create(data, usuarioId, empresa_id);
  
  // 1. Invalidar caché del Dashboard
  await deleteCache(`stats:tenant_${empresa_id}`);
  
  // 2. Disparar Webhook
  await notifyEvent(empresa_id, 'stock.updated', {
      producto_id: data.productoId,
      tipo: data.tipo,
      cantidad: data.cantidad,
      movimiento_id: result.id
  });
  // 3. Sincronizar con MercadoLibre (Background task)
  try {
      const pool = await connectDB();
      const prodRes = await pool.request()
          .input('id', sql.Int, data.productoId)
          .query('SELECT meli_item_id, stock FROM Productos WHERE id = @id');
      
      const product = prodRes.recordset[0];
      if (product && product.meli_item_id) {
          meliService.syncStock({
              meli_item_id: product.meli_item_id,
              availability: product.stock,
              empresa_id
          }).catch(e => logger.error({ err: e.message }, 'Failed background MeLi sync'));
      }
  } catch (error) {
      logger.error({ err: error.message }, 'Error triggering MeLi sync in service');
  }

  return result;
}

async function obtenerMovimientosRecientes(empresa_id, limite = 5) {
  return await movimientoRepository.getRecent(empresa_id, limite);
}

module.exports = { listarMovimientos, obtenerMovimientosRecientes, agregarMovimiento };
