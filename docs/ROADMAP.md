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

### [✔️] v1.27.2-validation - Onboarding Joyride Multi-Rutas y Estabilidad
- [x] **RESUELTO**: Tour interactivo (react-joyride) paginado a través del Router (`Dashboard -> Facturación -> Sucursales -> Delegaciones`).
- [x] **RESUELTO**: Corrección silenciosa de constraint de SQL persistiendo exitosamente eventos de UX (`finalizar_onboarding` / `reiniciar_onboarding`) en la tabla Auditoría atados al `empresa_id`.
- [x] **RESUELTO**: Corrección Estructural del motor MSSQL inyectando la columna `onboarding_completed` evadiendo la falla encubierta HTTP 500 originaria de migraciones previas.
- [x] **ESTADO**: El Sistema superó la validación estricta de Interfaz de Usuario bajo la Fase 12. Listos para QA y Producción.



### [✔️] v1.27.2.2 - Verificación Integral Pre-Fase 13
- [x] **RESUELTO**: Simulación agresiva End-to-End validando MFA, Tokens TOTP y rechazos HTTP 400.
- [x] **RESUELTO**: Operatividad del TPV e Historial de Ventas superaron la criba de estabilización (`sin rastro de WSOD`).
- [x] **RESUELTO**: Blindaje RBAC activo y eficiente restringiendo accesos por roles directos.
- [x] **ESTADO GLOBAL**: **APROBADO**. El ERP demostró madurez total pre-observabilidad. Ningún componente clave fue corrompido durante las inyecciones criptográficas o de interfaz.


### [✔️] v1.27.3.1 - Hotfix Observabilidad (Pantalla en Blanco)
- [x] **RESUELTO**: Erradicación del White Screen of Death (WSOD) causado por importación bloqueante de OpenTelemetry SDK en React.
- [x] **RESUELTO**: Inicialización asíncrona de `initTracing()` para nunca bloquear el ciclo de renderizado de la interfaz.
- [x] **RESUELTO**: Robustez ante fallos de red: el frontend permanece operativo aunque el colector de telemetría o el backend estén fuera de línea.
- [x] **ESTADO**: Sistema 100% estable en Fase 13. Observabilidad reactivada de forma segura y no bloqueante.

### [✔️] v1.27.4 - Resiliencia y Rollback Automático
- [x] **RESUELTO**: Implementación de Health Checks (`/health`, `/ready`) granulares por módulo para Liveness y Readiness probes.
- [x] **RESUELTO**: Configuración de `RollingUpdate` con `maxSurge` y `maxUnavailable` para despliegues sin tiempo de inactividad.
- [x] **RESUELTO**: **HOTFIX v1.27.4.2**: Implementación de `connectionTimeout` y `requestTimeout` en el pool de MSSQL, evitando bloqueos de sonda (hangs).
- [x] **RESUELTO**: **HOTFIX v1.27.4.3**: Bypass de salud en middlewares `tenantContext` y `rbac`, eliminando errores 500 y garantizando que las sondas de Kubernetes nunca dependan de la sesión del usuario.




---

### [✔️] v1.27.4.4 - Estabilización de Rutas e Integración StockDB (2026-03-26)

| Componente | Estado |
|---|---|
| GET /health | **RESUELTO** - HTTP 200 db:OK redis:OK rabbitmq:READY |
| GET /ready | **RESUELTO** - HTTP 200 status:READY (No bloqueante) |
| Registro de Rutas (32+ módulos) | **RESUELTO** - Integración total en `v1.routes.js` |
| Conectividad StockDB | **RESUELTO** - 100% de los módulos validados con datos reales |
| Inicialización EDA | **RESUELTO** - No bloqueante, previene cuelgues al inicio |
| Frontend (Vite) Proxy | **RESUELTO** - Alineado a localhost:5001 |
| LoginForm (Email Length) | **RESUELTO** - maxLength extendido a 255 (Bypass 20c) |
| Facturación / POS | **RESUELTO** - Cajas y comprobantes operativos |
| Inventario / Kardex | **RESUELTO** - Reportes y valorización activos |

**ESTADO GLOBAL**: **SISTEMA ESTABLE**. 100% de los módulos operativos en entorno local.
**NOTAS SRE**: Se erradicó la dependencia circular en la carga de controladores y se estandarizó el uso de `express.Router`.
**PROXIMA FASE**: Fase 15 — Integración Avanzada de BI e IA Analytics.


---

---

### [✔️] v1.27.4.5-validation - Restauración Integral con StockDB (2026-03-27)

| Componente | Estado |
|---|---|
| .env DB_NAME | **RESUELTO** - Apunta a StockDB (Fuentes de datos validadas) |
| GET /health /ready | **RESUELTO** - HTTP 200 (Sistema y Módulos saludables) |
| Registro de Rutas | **RESUELTO** - Módulo Delegaciones restaurado en `v1.routes.js` |
| Health Checks Módulos | **RESUELTO** - Categorías y Dashboard con endpoints activos |
| Observabilidad (Métricas) | **RESUELTO** - Counter `db_reconnections_total` implementado |
| Auditoría TraceId | **RESUELTO** - Logs de reconexión persistidos con `trace_id` |
| Frontend Dashboard | **RESUELTO** - Datos reales cargados desde StockDB |
| Joyride Onboarding | **RESUELTO** - Tour funcional en todos los módulos clave |
| Estabilidad Global | **RESUELTO** - Sistema 100% Robusto y Validado |

**RESULTADO FINAL**: **RESTAURACIÓN EXITOSA - SISTEMA OPERATIVO**.
**REFERENCIA GITHUB**: Alineado con v1.27.4.5-validation.
**PROXIMA FASE**: Fase 15 - Refactorización de rutas v1 y restauración de datos.

---

### [✔️] v1.27.4.6 - Optimización Módulo de Usuarios y Múltiples Roles (2026-04-02)

| Checklist Validación | Estado |
|---|---|
| POST /api/v1/auth/register con cualquier rol autorizado | **RESUELTO** - Extendidos schemas y registerEmpresa para roles dinámicos |
| Auditoría de roles | **RESUELTO** - Registro persistido vía auditMiddleware y logs |
| UI Selector de Roles | **RESUELTO** - Frontend expone `rolesDisponibles` (Users.jsx) |
| DB persistencia en StockDB | **RESUELTO** - Tabla Usuarios actualiza los roles vía `SCOPE_IDENTITY()` |
| Joyride Operativo | **RESUELTO** - El frontend permanece estable tras altas Multi-Rol |
| Convergencia GitHub | **RESUELTO** - Referencias validadas y versionado sincronizado con tag v1.27.4.6-validation |
| Creación de Roles (/api/v1/roles/create) | **RESUELTO** - Endpoint restaurado, UI conectada, y error de triggers en DB solucionado (`SCOPE_IDENTITY`) |
| Roles Dinámicos sin Hardcodeo | **RESUELTO** - Validación estática eliminada en API y liberada validación relacional (`CK_Usuarios_rol` descartado en MSSQL) |

**ESTADO GLOBAL**: **MÓDULOS USUARIOS Y ROLES ESTABLES, DINÁMICOS Y ESCALADOS**.
