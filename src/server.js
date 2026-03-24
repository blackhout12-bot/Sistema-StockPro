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
const { metricsMiddleware } = require('./middlewares/metrics');
const http = require('http');
const { initSocket } = require('./config/socket');

dotenv.config(); // Carga .env de la raíz de forma estándar

const app = express();

// ─── Senior Fallback Handlers ──────────────────────────────────
process.on('uncaughtException', (err) => {
    logger.error({ error: err.message, stack: err.stack }, 'FATAL UNCAUGHT EXCEPTION CATCHED - Preveniendo caída del servidor');
});
process.on('unhandledRejection', (reason, promise) => {
    logger.error({ reason, promise }, 'UNHANDLED REJECTION CATCHED - Preveniendo caída del servidor');
});

// ─── Debug Logger (Global) ──────────────────────────────────────
app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url, body: req.method === 'POST' ? 'REDACTED' : undefined }, 'Incoming Request');
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
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' || req.url === '/metrics' } }));

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
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
initSocket(server);

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', async () => {
    try {
        await rabbitMQ.connect();
        await eventBus.init();
        await setupAuditSubscribers();
        await setupNotificationSubscribers();
    } catch (err) {
        logger.error({ err }, 'Failed to initialize Event Driven Architecture');
    }
    logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, '🚀 Servidor backend iniciado con WebSockets (IPv4)');
  });
}

module.exports = app;
