const { connectDB } = require('../config/db');
const sql = require('mssql');
const logger = require('../utils/logger');

async function syncStock() {
  try {
    const pool = await connectDB();
    logger.info('Iniciando sincronización de stock huérfano...');

    // 1. Encontrar el depósito principal o el ID 1 (Sede Central)
    let mainDepositoId = 1;
    const depRes = await pool.request()
      .input('emp_id', sql.Int, 1)
      .query("SELECT id FROM Depositos WHERE empresa_id = @emp_id AND (es_principal = 1 OR id = 1) ORDER BY es_principal DESC");
    
    if (depRes.recordset.length > 0) {
      mainDepositoId = depRes.recordset[0].id;
    }
    logger.info(`Depósito seleccionado para sincronización: ID ${mainDepositoId}`);
    logger.info(`Depósito Principal seleccionado: ID ${mainDepositoId}`);

    // 2. Buscar productos de la empresa 1 que NO tengan entrada en ProductoDepositos
    const orphanRes = await pool.request()
      .input('emp_id', sql.Int, 1)
      .query(`
        SELECT p.id, p.nombre, p.stock 
        FROM Productos p 
        LEFT JOIN ProductoDepositos pd ON p.id = pd.producto_id 
        WHERE p.empresa_id = @emp_id AND pd.producto_id IS NULL
      `);
    
    const orphans = orphanRes.recordset;
    logger.info(`Se encontraron ${orphans.length} productos huérfanos.`);

    if (orphans.length > 0) {
      for (const product of orphans) {
        logger.info(`Vinculando producto: ${product.nombre} (ID: ${product.id}) -> Depósito: ${mainDepositoId} (Stock: ${product.stock})`);
        await pool.request()
          .input('pid', sql.Int, product.id)
          .input('did', sql.Int, mainDepositoId)
          .input('qty', sql.Decimal(18, 2), product.stock || 0)
          .query("INSERT INTO ProductoDepositos (producto_id, deposito_id, cantidad) VALUES (@pid, @did, @qty)");
      }
      logger.info('Sincronización completada con éxito.');
    } else {
      logger.info('No hay productos huérfanos que sincronizar.');
    }

  } catch (error) {
    logger.error({ err: error.message }, 'Error durante la sincronización');
  }
  process.exit(0);
}

syncStock();
