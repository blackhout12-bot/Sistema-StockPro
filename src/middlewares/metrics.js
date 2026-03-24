const promClient = require('prom-client');

// Histogram para medir la duración de las peticiones HTTP
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'stock_system_http_request_duration_ms',
  help: 'Duración de las peticiones HTTP en milisegundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [10, 50, 100, 300, 500, 1000, 3000, 5000]
});

// Counter para operaciones de Negocio: Facturación
const businessFacturasTotal = new promClient.Counter({
  name: 'stock_system_business_facturas_total',
  help: 'Total de facturas emitidas exitosamente en el ERP',
  labelNames: ['empresa_id']
});

// Counter para operaciones de Negocio: POS Ventas
const businessPosSalesTotal = new promClient.Counter({
  name: 'stock_system_business_pos_sales_total',
  help: 'Total de ventas generadas desde la caja registradora (POS)',
  labelNames: ['empresa_id', 'sucursal_id']
});

// Middleware de recolección de métricas HTTP
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Evitamos inundar con las rutas de salud y métricas del propio prom-client
    if (req.path !== '/metrics' && req.path !== '/health') {
      httpRequestDurationMicroseconds.labels(
        req.method,
        req.route ? req.route.path : req.path,
        res.statusCode
      ).observe(duration);
    }
  });

  next();
};

module.exports = {
  metricsMiddleware,
  businessFacturasTotal,
  businessPosSalesTotal
};
