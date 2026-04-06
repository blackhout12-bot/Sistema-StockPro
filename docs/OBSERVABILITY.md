# Observabilidad y Monitoreo (v1.27.7)

Este documento detalla la configuración de observabilidad, métricas y alertas implementadas en el ERP.

## 📊 Métricas Expuestas

El sistema expone métricas en formato Prometheus en el endpoint `/metrics`.

### Métricas Críticas (APM)
- `stock_system_http_request_duration_ms`: Latencia de peticiones HTTP (Histogram).
- `stock_system_http_errors_total`: Contador de errores 4xx/5xx por ruta y método.
- `stock_system_db_query_duration_seconds`: Duración de consultas SQL (Histogram).
- `stock_system_db_reconnections_total`: Contador de reconexiones a la base de datos.
- `stock_system_business_facturas_total`: Total de facturas emitidas (Métrica de Negocio).

### 🔹 Tabla inicial de métricas observadas (baseline)

| Métrica / Módulo        | Valor inicial | Umbral esperado | Estado |
|--------------------------|---------------|-----------------|--------|
| Dashboard latencia       | 1.8s          | <2s             | ✅ OK   |
| Categorías latencia      | 0.9s          | <1s             | ✅ OK   |
| Facturación inserción    | 1.7s          | <2s             | ✅ OK   |
| Facturación listado      | 0.8s          | <1s             | ✅ OK   |
| Auditoría overhead       | 4%            | <5%             | ✅ OK   |
| CPU promedio             | 65%           | <80%            | ✅ OK   |
| RAM promedio             | 70%           | <80%            | ✅ OK   |
| Error rate global        | 2%            | <5%             | ✅ OK   |

## 🛡️ Reglas de Alerta (Prometheus)

Para configurar las alertas en un entorno de producción (AlertManager), se recomiendan las siguientes reglas:

```yaml
groups:
  - name: stock_system_alerts
    rules:
      - alert: HighLatency
        expr: stock_system_http_request_duration_ms_sum / stock_system_http_request_duration_ms_count > 2.0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Latencia alta en {{ $labels.route }}"
          description: "La respuesta promedio es mayor a 2s por más de 5 minutos."

      - alert: HighErrorRate
        expr: rate(stock_system_http_errors_total[5m]) / rate(stock_system_http_request_duration_ms_count[5m]) > 0.05
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Tasa de errores superior al 5%"

      - alert: DatabaseSlowQueries
        expr: rate(stock_system_db_query_duration_seconds_sum[5m]) / rate(stock_system_db_query_duration_seconds_count[5m]) > 0.5
        for: 5m
        labels:
          severity: warning
```

## 📈 Grafana Dashboard (Blueprint)

Copia y pega este JSON en el panel de Importar de Grafana para visualizar la salud del sistema.

<details>
<summary>Haga clic para ver el JSON del Dashboard</summary>

```json
{
  "annotations": { "list": [] },
  "editable": true,
  "gnetId": null,
  "graphTooltip": 0,
  "id": null,
  "links": [],
  "panels": [
    {
      "title": "Throughput (RPS)",
      "type": "timeseries",
      "targets": [{ "expr": "rate(stock_system_http_request_duration_ms_count[1m])" }]
    },
    {
      "title": "Latencia P95",
      "type": "timeseries",
      "targets": [{ "expr": "histogram_quantile(0.95, sum(rate(stock_system_http_request_duration_ms_bucket[5m])) by (le, route))" }]
    },
    {
      "title": "Error Rate %",
      "type": "stat",
      "targets": [{ "expr": "sum(rate(stock_system_http_errors_total[5m])) / sum(rate(stock_system_http_request_duration_ms_count[5m])) * 100" }]
    },
    {
      "title": "DB Query Duration (Avg)",
      "type": "timeseries",
      "targets": [{ "expr": "rate(stock_system_db_query_duration_seconds_sum[5m]) / rate(stock_system_db_query_duration_seconds_count[5m])" }]
    }
  ],
  "schemaVersion": 26,
  "style": "dark",
  "tags": ["ERP", "Backend"],
  "templating": { "list": [] },
  "time": { "from": "now-1h", "to": "now" },
  "title": "StockPro System Health"
}
```
</details>

## 📜 Logs Estructurados

Todos los logs se emiten en formato JSON e incluyen un `traceId` único por petición para facilitar la correlación en sistemas de agregación (como ELK o Grafana Loki).

**Ejemplo de log:**
```json
{
  "level": 30,
  "time": 1696593600000,
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "url": "/api/v1/facturacion",
  "msg": "Factura creada correctamente"
}
```
