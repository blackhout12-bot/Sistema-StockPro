const { connectDB } = require('../config/db');
const sql = require('mssql');
const pino = require('pino');
const logger = pino({ level: 'info', transport: { target: 'pino-pretty' } });

async function syncAllDepositos() {
  try {
    const pool = await connectDB();
    logger.info('Iniciando sincronización TOTAL de productos en depósitos...');

    // 1. Obtener todas las empresas activas
    const empresaRes = await pool.request().query("SELECT id, nombre FROM Empresa");
    const empresas = empresaRes.recordset;

    for (const empresa of empresas) {
      logger.info(`Procesando Empresa: ${empresa.nombre} (ID: ${empresa.id})`);

      // 2. Obtener TODOS los depósitos activos de esta empresa
      const depRes = await pool.request()
        .input('emp_id', sql.Int, empresa.id)
        .query("SELECT id, nombre FROM Depositos WHERE empresa_id = @emp_id AND activo = 1");
      
      const depositos = depRes.recordset;
      if (depositos.length === 0) {
        logger.warn(`Empresa ${empresa.id} no tiene depósitos activos. Saltando.`);
        continue;
      }

      // 3. Obtener todos los productos de esta empresa
      const prodRes = await pool.request()
        .input('emp_id', sql.Int, empresa.id)
        .query("SELECT id, nombre, stock FROM Productos WHERE empresa_id = @emp_id");
      
      const productos = prodRes.recordset;
      logger.info(`Empresa ${empresa.id} tiene ${productos.length} productos. Verificando vinculación con ${depositos.length} depósitos.`);

      for (const prod of productos) {
        for (const depo of depositos) {
          try {
            // Verificar si ya existe la vinculación
            const checkRes = await pool.request()
              .input('pid', sql.Int, prod.id)
              .input('did', sql.Int, depo.id)
              .query("SELECT 1 FROM ProductoDepositos WHERE producto_id = @pid AND deposito_id = @did");

            if (checkRes.recordset.length === 0) {
              // Si no existe, crear con stock 0 (excepto si es el principal y queremos asignarle el stock global, pero por ahora 0 para evitar duplicidad si no sabemos cuál es el origen)
              // O mejor, si es el Depósito Principal, le ponemos el stock global.
              // Para simplificar y resolver la visibilidad: insertamos con 0 si no existe.
              await pool.request()
                .input('pid', sql.Int, prod.id)
                .input('did', sql.Int, depo.id)
                .input('cant', sql.Decimal(18, 2), 0)
                .query("INSERT INTO ProductoDepositos (producto_id, deposito_id, cantidad, actualizado_en) VALUES (@pid, @did, @cant, GETDATE())");
              logger.info(`  Vinculado: ${prod.nombre} (ID: ${prod.id}) -> Depósito: ${depo.nombre} (ID: ${depo.id})`);
            }
          } catch (err) {
            logger.error(`  Error vinculando producto ${prod.id} con depósito ${depo.id}: ${err.message}`);
          }
        }
      }
    }

    logger.info('Sincronización TOTAL completada con éxito.');
  } catch (error) {
    logger.error(`Error crítico: ${error.message}`);
  } finally {
    process.exit(0);
  }
}

syncAllDepositos();
