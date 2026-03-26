// src/config/db.js
const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const logger = require('../utils/logger');

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

// Graceful shutdown
process.on('SIGTERM', async () => { await closeDB(); process.exit(0); });
process.on('SIGINT', async () => { await closeDB(); process.exit(0); });

module.exports = { connectDB, connectReadOnlyDB, closeDB, sql };

