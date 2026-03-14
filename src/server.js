// src/server.js
// Debe ser lo primero para instrumentar todos los módulos
if (process.env.OTEL_ENABLED === 'true') {
  require('./config/tracing');
}
const express = require('express');
const promClient = require('prom-client');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');
const logger = require('./utils/logger');
const authenticate = require('./middlewares/auth');

dotenv.config(); // Carga .env de la raíz de forma estándar

const app = express();

// ─── Rate Limiters Específicos ──────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiadas solicitudes de autenticación. Intenta en 15 minutos.' }
});

// ─── HTTP Request Logger ────────────────────────────────────────
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));

// ─── Security Headers ───────────────────────────────────────────
app.use(helmet());

// ─── CORS ───────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (ej: Postman, curl)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    logger.warn({ origin }, 'CORS bloqueado');
    callback(new Error('No permitido por CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Rate Limit Global ──────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Intenta más tarde.' }
}));

// ─── Health Check ───────────────────────────────────────────────
const { getRedisStatus, getBullmqStatus } = require('./config/redis');

app.get('/health', (_req, res) => {
  const status = getRedisStatus();
  const bullmq = getBullmqStatus();
  
  res.status(status === 'OK' ? 200 : 207).json({ 
    status: 'ok', 
    http_server: 'OK',
    redis_connection: status,
    bullmq: bullmq,
    time: new Date().toISOString() 
  });
});

// ─── Prometheus Metrics ──────────────────────────────────────────
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'stock_system_' });

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

// ─── Documentación Swagger ──────────────────────────────────────
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customSiteTitle: "Stock System API Docs"
}));

// ─── Rutas Versionadas ──────────────────────────────────────────
const v1Router = require('./routes/v1.routes');
const v2Router = require('./routes/v2.routes');
app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);

// ─── 404 ─────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Recurso no encontrado' }));

// ─── Error Handler ───────────────────────────────────────────────
app.use(require('./middlewares/errorHandler'));

// ─── Background Workers & Cron Jobs (BullMQ) ─────────────────────
const initQueues = require('./queues/initQueues');
initQueues();

// ─── Arranque ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, '🚀 Servidor backend iniciado');
  });
}

module.exports = app;
