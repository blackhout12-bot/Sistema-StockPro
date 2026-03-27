const { connectDB } = require('../config/db');
const sql = require('mssql');
const pino = require('pino');
const logger = pino({ level: 'info', transport: { target: 'pino-pretty' } });

async function syncMultiTenantStock() {
  try {
    const pool = await connectDB();
    logger.info('Iniciando sincronización multi-inquilino de stock...');

    // 1. Obtener todas las empresas
    const empresaRes = await pool.request().query("SELECT id, nombre FROM Empresa");
    const empresas = empresaRes.recordset;

    for (const empresa of empresas) {
      logger.info(`Procesando Empresa: ${empresa.nombre} (ID: ${empresa.id})`);

      // 2. Obtener depósitos de esta empresa
      const depRes = await pool.request()
        .input('emp_id', sql.Int, empresa.id)
        .query("SELECT id, nombre, es_principal FROM Depositos WHERE empresa_id = @emp_id");
      
      const depositos = depRes.recordset;
      if (depositos.length === 0) {
        logger.warn(`Empresa ${empresa.id} no tiene depósitos configurados. Saltando.`);
        continue;
      }

      // Encontrar el depósito principal o el primero disponible
      const mainDepo = depositos.find(d => d.es_principal) || depositos[0];
      logger.info(`Depósito seleccionado para sincronización: ${mainDepo.nombre} (ID: ${mainDepo.id})`);

      // 3. Obtener productos de esta empresa que NO tienen entrada en ningún depósito de su empresa
      // O que al menos no tienen entrada en el depósito principal
      const prodRes = await pool.request()
        .input('emp_id', sql.Int, empresa.id)
        .input('depo_id', sql.Int, mainDepo.id)
        .query(`
          SELECT p.id, p.nombre, p.stock
          FROM Productos p
          WHERE p.empresa_id = @emp_id
          AND NOT EXISTS (
            SELECT 1 FROM ProductoDepositos pd 
            WHERE pd.producto_id = p.id AND pd.deposito_id = @depo_id
          )
        `);

      const productosHuerfanos = prodRes.recordset;
      logger.info(`Encontrados ${productosHuerfanos.length} productos huérfanos para empresa ${empresa.id}.`);

      for (const prod of productosHuerfanos) {
        try {
          await pool.request()
            .input('prod_id', sql.Int, prod.id)
            .input('depo_id', sql.Int, mainDepo.id)
            .input('cant', sql.Decimal(18, 2), prod.stock || 0)
            .query(`
              INSERT INTO ProductoDepositos (producto_id, deposito_id, cantidad, creado_en)
              VALUES (@prod_id, @depo_id, @cant, GETDATE())
            `);
          logger.info(`  Sincronizado: ${prod.nombre} (ID: ${prod.id}) -> Depósito: ${mainDepo.id}`);
        } catch (err) {
          logger.error(`  Error al sincronizar producto ${prod.id}: ${err.message}`);
        }
      }
    }

    logger.info('Sincronización multi-inquilino completada con éxito.');
  } catch (error) {
    logger.error(`Error crítico en la sincronización: ${error.message}`);
  } finally {
    process.exit(0);
  }
}

syncMultiTenantStock();
