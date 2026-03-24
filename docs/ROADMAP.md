# Plan de Ruta (Roadmap TB Gestión)

Este documento centraliza las travesías técnicas de la arquitectura, divididas en fases de escalamiento vertical y horizontal.

## Hitos Logrados y en Desarrollo

```mermaid
gantt
    title Cronograma de Hitos SRE - TB Gestión
    dateFormat  YYYY-MM-DD
    section Estabilización Relacional
    Multi-Contexto (Bases M:N)    :done, v1_21, 2026-03-22, 1d
    Separación Lógica DB          :done, v1_21_3, 2026-03-22, 1d
    section Alta Disponibilidad Kubernetes
    QoS de RAM y OOM-Kill Limits  :done, v1_22, 2026-03-24, 1d
    Auto-Rollback CI/CD Pipeline  :done, v1_22_1, 2026-03-24, 1d
    section Autenticación Avanzada
    Delegación Organizacional     :done, v1_23, 2026-03-24, 1d
    Bugfix Pila de Endpoints      :done, v1_23_1, 2026-03-24, 1d
    Documentación Reproducible    :active, v1_24, 2026-03-24, 1d
    section Innovación Q2
    Integración Cajas Externas (POS) :crit, v1_25, 2026-04-01, 3d
    Modelos de Alertas con IA        :v1_26, 2026-04-10, 4d
```

## Tabla de Validación (Checklist Estricto por Versión)

### [✔️] v1.21.0 - Multi-Contexto y Arquitectura Base
- [x] Desacople de Contextos vs Usuarios a tabla M:N real en MSSQL.
- [x] Frontend refactorizado para soportar múltiples empresas sin colisión de Cookies.
- [x] Endpoints limpios de `estado` / `creado_en` puristas.

### [✔️] v1.22.0 - Kubernetes Scalability
- [x] Se declararon límites (Limits/Requests) de CPU y RAM (`500m`, `512Mi`) en Helm Pods de Frontend.
- [x] Inyección de script bash en el GH Action / GitLab CI para emitir `helm rollback` en caso de fallos.
- [x] Readiness / Liveness HTTP Probes configuradas contra el healthcheck Node.

### [✔️] v1.23.0 - Delegaciones Flexibles
- [x] Constraint estructural de Fechas para préstamos temporales (`fecha_fin > fecha_inicio`).
- [x] Rutas Flexibles que no colapsen los test automatizados: `PUT/POST /revocar/:id`, omitiendo ID para testbeds.
- [x] Tolerancia a infinitud temporal (`fecha_fin NULL`).

---

*Nota: La versión v1.24.X comprende este mismo ciclo orgánico de Documentación Markdown y Arquitectura.*
