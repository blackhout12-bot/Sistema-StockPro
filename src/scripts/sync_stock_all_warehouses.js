const { connectDB } = require('../config/db');
const sql = require('mssql');
const pino = require('pino');
const logger = pino({ level: 'info', transport: { target: 'pino-pretty' } });

async function syncStockAllWarehouses() {
  try {
    const pool = await connectDB();
    logger.info('Iniciando sincronización GLOBAL de stock en todos los depósitos...');

    // 1. Obtener todos los productos
    const prodRes = await pool.request().query("SELECT id, nombre, empresa_id FROM Productos");
    const productos = prodRes.recordset;

    for (const prod of productos) {
      // 2. Calcular stock total para este producto
      const stockRes = await pool.request()
        .input('pid', sql.Int, prod.id)
        .query("SELECT SUM(cantidad) as total FROM ProductoDepositos WHERE producto_id = @pid");
      
      let totalStock = stockRes.recordset[0].total || 0;

      // Si el stock total es 0, pero el producto tiene un valor en la tabla 'stock' de Productos (campo legado/global), usamos ese.
      if (totalStock === 0) {
        const globalRes = await pool.request().input('pid', sql.Int, prod.id).query("SELECT stock FROM Productos WHERE id = @pid");
        totalStock = globalRes.recordset[0].stock || 0;
      }

      if (totalStock > 0) {
        logger.info(`Sincronizando ${prod.nombre} (ID: ${prod.id}) con Stock Total: ${totalStock}`);

        // 3. Obtener todos los depósitos de la empresa
        const depRes = await pool.request()
          .input('eid', sql.Int, prod.empresa_id)
          .query("SELECT id FROM Depositos WHERE empresa_id = @eid AND activo = 1");
        
        const depositos = depRes.recordset;

        for (const depo of depositos) {
          // 4. Upsert (Actualizar o Insertar) el stock total en cada depósito
          await pool.request()
            .input('pid', sql.Int, prod.id)
            .input('did', sql.Int, depo.id)
            .input('cant', sql.Decimal(18, 2), totalStock)
            .query(`
              IF EXISTS (SELECT 1 FROM ProductoDepositos WHERE producto_id = @pid AND deposito_id = @did)
                UPDATE ProductoDepositos SET cantidad = @cant, actualizado_en = GETDATE() WHERE producto_id = @pid AND deposito_id = @did
              ELSE
                INSERT INTO ProductoDepositos (producto_id, deposito_id, cantidad, actualizado_en) VALUES (@pid, @did, @cant, GETDATE())
            `);
        }
      }
    }

    logger.info('Sincronización GLOBAL completada.');
  } catch (error) {
    logger.error(`Error: ${error.message}`);
  } finally {
    process.exit(0);
  }
}

syncStockAllWarehouses();
