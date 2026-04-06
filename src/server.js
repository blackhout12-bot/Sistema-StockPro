// src/server.js
const express = require('express');
const promClient = require('prom-client');
const dotenv = require('dotenv');
dotenv.config();

if (process.env.OTEL_ENABLED === 'true') {
  require('./config/tracing');
}

const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');
const logger = require('./utils/logger');
const authenticate = require('./middlewares/auth');
const { metricsMiddleware } = require('./middlewares/metrics');
const traceMiddleware = require('./middlewares/trace.middleware');
const http = require('http');
const { initSocket } = require('./config/socket');

const app = express();

// ─── Senior Fallback Handlers ──────────────────────────────────
process.on('uncaughtException', (err) => {
    logger.error({ error: err.message, stack: err.stack }, 'FATAL UNCAUGHT EXCEPTION CATCHED - Preveniendo caída del servidor');
});
process.on('unhandledRejection', (reason, promise) => {
    logger.error({ reason, promise }, 'UNHANDLED REJECTION CATCHED - Preveniendo caída del servidor');
});

// ─── TraceId & Global Context ──────────────────────────────────
app.use(traceMiddleware);

// ─── Debug Logger (Global) ──────────────────────────────────────
app.use((req, res, next) => {
  logger.info({ 
    traceId: req.traceId,
    method: req.method, 
    url: req.url, 
    body: req.method === 'POST' ? 'REDACTED' : undefined 
  }, 'Incoming Request');
  next();
});

// ─── Metrics (Prometheus) ───────────────────────────────────────
promClient.collectDefaultMetrics();
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', promClient.register.contentType);
        res.end(await promClient.register.metrics());
    } catch (ex) {
        res.status(500).end(ex);
    }
});

// ─── Rate Limiters ──────────────
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window`
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Demasiadas solicitudes, por favor intente nuevamente más tarde'
});

// ─── HTTP Request Logger ────────────────────────────────────────
app.use(pinoHttp({ 
    logger, 
    genReqId: (req) => req.traceId, // Usar nuestro traceId generado por el middleware
    autoLogging: { ignore: (req) => req.url === '/health' || req.url === '/metrics' },
    customLogLevel: (req, res, err) => {
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
    }
}));

// ─── Security Headers (OWASP) ───────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: false, // Leave CSP loosely coupled for React dev servers
    noSniff: false, // Allow browsers to mime-sniff webp images with .png extensions
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true // Strict TLS/HTTPS compliance
    }
}));

// ─── CORS ───────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: true, // Permitir todo en local para debug
  credentials: true
}));

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// app.use(rateLimit({ ... })); // Desactivado globalmente

// ─── Health Check ───────────────────────────────────────────────
const { getRedisStatus, getBullmqStatus } = require('./config/redis');
const { connectDB } = require('./config/db');
const rabbitMQ = require('./config/rabbitmq');

app.get('/health', async (_req, res) => {
  try {
    const status = getRedisStatus();
    const bullmq = getBullmqStatus();
    
    // Ping DB
    const pool = await connectDB();
    await pool.request().query('SELECT 1 AS ping');

    // Ping RabbitMQ
    const rabbitMQStatus = (rabbitMQ.connection && rabbitMQ.channel) ? 'OK' : 'OFFLINE';

    res.status((status === 'OK' && rabbitMQStatus === 'OK') ? 200 : 207).json({ 
      status: 'ok', 
      http_server: 'OK',
      db_connection: 'OK',
      redis_connection: status,
      bullmq: bullmq,
      rabbitmq: rabbitMQStatus,
      time: new Date().toISOString() 
    });
  } catch(e) {
    logger.error({ err: e.message }, 'Healthcheck falló. Conexión a BD caída');
    res.status(500).json({ status: 'error', message: 'Database offline' });
  }
});

// ─── Global /ready & /ping ──────────────────────────────────────
app.get('/ready', async (_req, res) => {
  const checks = { database: 'UNKNOWN', redis: 'UNKNOWN', rabbitmq: 'UNKNOWN' };
  let healthy = true;
  try {
    const pool = await connectDB();
    await pool.request().query('SELECT 1 AS ping');
    checks.database = 'OK';
  } catch (e) {
    checks.database = 'DOWN'; healthy = false;
  }
  const rStatus = getRedisStatus();
  checks.redis = rStatus === 'OK' ? 'OK' : 'DEGRADED';
  checks.rabbitmq = (rabbitMQ.connection && rabbitMQ.channel) ? 'OK' : 'DEGRADED';
  const httpStatus = checks.database === 'OK' ? (healthy ? 200 : 207) : 503;
  return res.status(httpStatus).json({ status: checks.database === 'OK' ? 'READY' : 'NOT_READY', checks, time: new Date().toISOString() });
});

app.get('/ping', (_req, res) => res.json({ status: 'pong', time: new Date().toISOString() }));

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

// Aplicar el middleware de métricas solo para las rutas API
app.use('/api', metricsMiddleware);

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

// ─── Event Bus & Asynchronous Subscribers (RabbitMQ) ─────────────
const eventBus = require('./events/eventBus');
const setupAuditSubscribers = require('./events/subscribers/auditSubscriber');
const setupNotificationSubscribers = require('./events/subscribers/notificationSubscriber');

// ─── Arranque ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
const server = http.createServer(app);
initSocket(server);

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, '🚀 Servidor backend iniciado con WebSockets (IPv4)');
    
    // Inicialización Asíncrona de EDA (RabbitMQ) para evitar bloqueos en el arranque
    (async () => {
        try {
            await rabbitMQ.connect();
            await eventBus.init();
            await setupAuditSubscribers();
            await setupNotificationSubscribers();
            logger.info('📡 Arquitectura de Eventos (EDA) inicializada correctamente');
        } catch (err) {
            logger.error({ err: err.message }, '⚠️ Fallo crítico inicializando EDA. Reintentando en background...');
        }
    })();
  });
}

module.exports = app;
