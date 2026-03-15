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
const http = require('http');
const { initSocket } = require('./config/socket');

dotenv.config(); // Carga .env de la raíz de forma estándar

const app = express();

// ─── Debug Logger (Global) ──────────────────────────────────────
app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url, body: req.method === 'POST' ? 'REDACTED' : undefined }, 'Incoming Request');
  next();
});

// ─── Rate Limiters (Desactivados para Debug Local) ──────────────
const authLimiter = (req, res, next) => next();

// ─── HTTP Request Logger ────────────────────────────────────────
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));

// ─── Security Headers ───────────────────────────────────────────
// app.use(helmet()); // Desactivado temporalmente para Debug

// ─── CORS ───────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: true, // Permitir todo en local para debug
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// app.use(rateLimit({ ... })); // Desactivado globalmente

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
const publicRouter = require('./routes/public.routes');
const aiRouter = require('./routes/ai.routes');
app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);
app.use('/api/public', publicRouter);
app.use('/api/ai', aiRouter);


// ─── 404 ─────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Recurso no encontrado' }));

// ─── Error Handler ───────────────────────────────────────────────
app.use(require('./middlewares/errorHandler'));

// ─── Background Workers & Cron Jobs (BullMQ) ─────────────────────
const initQueues = require('./queues/initQueues');
initQueues();

// ─── Arranque ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
initSocket(server);

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, '🚀 Servidor backend iniciado con WebSockets (IPv4)');
  });
}

module.exports = app;
