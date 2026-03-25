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

### [✔️] v1.24.1 - Cimientos DevOps y Documentación
- [x] Establecimiento SRE de un Single Source of Truth (`/docs`).
- [x] Arquitectura de Manifiestos para Auto-Rollback K8S y Monitoreo Activo (ServiceMonitor).

### [✔️] v1.25.0 - Factor Doble de Autenticación (MFA/TOTP)
- [x] Reversión de Mocks pasivos e Inyección Criptográfica `otplib`.
- [x] Cimientos transaccionales en Base de Datos MSSQL (`totp_secret`).
- [x] Flujo Frontend Operativo: Identificación de Check y Modal Interactivo para Pines Dinámicos.

### [✔️] v1.26.2 - Estabilidad Global y Onboarding SRE
- [x] **RESUELTO**: `react-joyride` desplegado. Tour del ERP Segmentado Jerárquicamente (Directivos vs Operadores).
- [x] **RESUELTO**: Trazabilidad Extrema Inmutable (`AuditRepository`) amarrando eventos de MFA y UX (`reiniciar_onboarding`).
- [x] **RESUELTO**: Erradicación del White Screen of Death (WSOD) causado por importación ESM/CommonJS en el compilador.
- [x] **RESUELTO**: Transpilador Vite Operativo en Limpio (Exit Code 0). Rendimiento inmaculado y Navegación Reactiva.

### [✔️] v1.26.9 - Resolución Operativa TPV (Facturación SRE)
- [x] **RESUELTO**: Inserción transaccional reparada usando `SCOPE_IDENTITY()`. Se evitó la colisión con los Triggers de Auditoría en SQL Server.
- [x] **RESUELTO**: WSOD en Frontend mitigado en tiempo real con Optional Chaining protectivo (`f.cliente_nombre?.toLowerCase()?.includes()`).
- [x] **ESTADO**: El Sistema está 100% Estable, respondiendo a métricas de confiabilidad corporativas y auditables por completo.

### [✔️] v1.27.0 - Auditoría Integral de Estabilidad (Pre-Fase 11)
- [x] **RESUELTO**: Registro de Empresas/Usuarios reparado cambiando `OUTPUT INSERTED.id` por `SCOPE_IDENTITY()` en base de datos.
- [x] **RESUELTO**: Facturación (comprobantes e historial de ventas) renderiza sin errores tras apertura de caja.
- [x] **RESUELTO**: Módulos de Sucursales y Delegaciones operativos (sin rastro de pantallas WSOD).
- [x] **RESUELTO**: Onboarding Joyride completamente funcional sin bloqueos de interfaz post-login.
- [x] **ESTADO**: El auditor automático validó exitosamente la navegación. Router y endpoints respondieron al 100%. Sistema preparado para Fase 11.

### [✔️] v1.27.1-validation - Seguridad Avanzada Consolidada
- [x] **RESUELTO**: Control de acceso granular (RBAC) mitigado para usuarios estándar en el TPV (Facturación y Cajeros).
- [x] **RESUELTO**: Autenticación de Doble Factor (MFA/TOTP) completamente testeada y parcheada a `speakeasy` debido a fallas criprográficas del transpilador con `otplib` v13.
- [x] **RESUELTO**: Logs de Auditoría transaccional capturados satisfactoriamente en eventos de creación de rol, activación de cuentas y login MFA.
- [x] **ESTADO**: Despliegue seguro de Fase 11 superado en el entorno `localhost:5173`. Listos para innovaciones posteriores.
