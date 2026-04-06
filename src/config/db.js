// src/config/db.js
const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const logger = require('../utils/logger');
const { dbReconnectionsTotal, dbQueryDurationSeconds } = require('../middlewares/metrics');

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 1433,
  connectionTimeout: 5000, // 5 segundos para fallar si no conecta
  requestTimeout: 15000,   // 15 segundos para consultas
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 10,
    min: parseInt(process.env.DB_POOL_MIN) || 2,
    idleTimeoutMillis: 30_000,
  },
};

// Configuración para Réplica de Lectura (Opcional)
const readConfig = {
    ...dbConfig,
    server: process.env.DB_READ_SERVER || dbConfig.server, // Si no hay réplica, usa el mismo servidor
    pool: {
        max: parseInt(process.env.DB_READ_POOL_MAX) || 20, // Reportes suelen requerir más conexiones
        min: 2,
        idleTimeoutMillis: 30_000,
    }
};

let pool = null;
let readPool = null;
let connectingPromise = null;
let connectingReadPromise = null;

async function connectDB() {
  if (pool && pool.connected) return pool;
  if (connectingPromise) return connectingPromise;

  connectingPromise = sql.connect(dbConfig)
    .then((p) => {
      pool = p;
      connectingPromise = null;
      pool.on('error', (err) => { logger.error({ err }, 'SQL Server pool error'); pool = null; });
      logger.info('Conectado a SQL Server (Escritura)');
      
      // ─── Métricas y Auditoría de Reconexión ───
      try {
        dbReconnectionsTotal.inc({ pool: 'Escritura' });
        const { trace, context } = require('@opentelemetry/api');
        const span = trace.getSpan(context.active());
        const trace_id = span ? span.spanContext().traceId : null;

        // Registro silencioso en Auditoría (empresa_id: 1 para el sistema)
        pool.request()
          .input('accion', 'reconexion_exitosa')
          .input('entidad', 'BaseDatos')
          .input('trace_id', trace_id)
          .query(`
            INSERT INTO dbo.Auditoria (empresa_id, usuario_id, accion, entidad, valor_nuevo, trace_id)
            VALUES (1, NULL, @accion, @entidad, 'Pool Escritura Reestablecido', @trace_id)
          `).catch(() => {});
      } catch (e) {}
      // ──────────────────────────────────────────

      return pool;
    })
    .catch((err) => {
      connectingPromise = null;
      pool = null;
      logger.error({ err: err.message }, 'Error de conexión a SQL Server (Escritura)');
      throw err;
    });

  return connectingPromise;
}

/**
 * Obtiene una conexión optimizada para lectura (Réplica).
 * Si no está configurada, devuelve la conexión maestra.
 */
async function connectReadOnlyDB() {
    // Si no hay servidor de lectura diferente, usamos el pool normal
    if (!process.env.DB_READ_SERVER) return connectDB();

    if (readPool && readPool.connected) return readPool;
    if (connectingReadPromise) return connectingReadPromise;

    connectingReadPromise = new sql.ConnectionPool(readConfig).connect()
        .then((p) => {
            readPool = p;
            connectingReadPromise = null;
            logger.info('Conectado a Réplica de Lectura SQL');
            return readPool;
        })
        .catch((err) => {
            connectingReadPromise = null;
            readPool = null;
            logger.error({ err: err.message }, 'Error de conexión a Réplica de Lectura. Reintentando con Maestra...');
            return connectDB(); // Fallback a la maestra en caso de error en réplica
        });

    return connectingReadPromise;
}

async function closeDB() {
  if (pool) await pool.close();
  if (readPool) await readPool.close();
  pool = null;
  readPool = null;
  logger.info('Conexiones a SQL Server cerradas');
}

/**
 * Ejecuta una consulta SQL midiendo su tiempo de ejecución para métricas.
 */
async function queryWithMetrics(queryString, params = {}, type = 'SELECT', table = 'unknown') {
    const start = Date.now();
    try {
        const activePool = await connectDB();
        const request = activePool.request();
        
        // Cargar parámetros si existen
        Object.keys(params).forEach(key => {
            request.input(key, params[key]);
        });

        const result = await request.query(queryString);
        const duration = (Date.now() - start) / 1000; // Segundos
        dbQueryDurationSeconds.labels(type, table).observe(duration);
        return result;
    } catch (err) {
        throw err;
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => { await closeDB(); process.exit(0); });
process.on('SIGINT', async () => { await closeDB(); process.exit(0); });

module.exports = { connectDB, connectReadOnlyDB, closeDB, queryWithMetrics, sql };

