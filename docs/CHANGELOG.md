# Changelog Semántico

Todos los cambios notables de TB Gestión se documentarán en este archivo según el estándar *Keep a Changelog*.

## [v1.24.0] - 2026-03-24
### Añadido
- Arquitectura SSOT en `docs/`.
- Gantt Visual de Roadmap v1.21 a futuras.
- Guías de aprovisionamiento reproducibles (Kubernetes y Docker).
- Listas de control SRE transversales por módulo cruzado en `AUDIT.md`.

## [v1.23.1] - 2026-03-24
### Arreglado
- Corrección de la colisión 500 originada por la propiedad `checkPermiso` que tumbaba el motor Router por `undefined variable`.
- Rutas PUT/POST extendidas `/revocar` e inyectables sin Path Variable forzoso.
- Normalización formal de Tabla SQL `Delegaciones` a un estilo DDL purista descartando columnas estelares `estado` y `creado_en`.

## [v1.23.0] - 2026-03-24
### Añadido
- Middleware de Auditoría y Modelo M:N para Préstamo y Asignación cruzada entre usuarios (Delegación de Poderes Temporales).
- Interfaz Gráfica (`Delegaciones.jsx`) anexada al sub-módulo de Administración con botones de revocación interactiva bajo *React-Query*.

## [v1.22.1] - 2026-03-24
### Modificado
- Integración de scripts estáticos en la Pipeline Continua (CI/CD) para evocar Auto-Rollback sobre Helm Deployments fallidos simulando los instintos SRE.

## [v1.22.0] - 2026-03-24
### Añadido
- Escalabilidad QoS estricta inyectada localmente en manifiestos *requests/limits*, mitigando el temido "OOM-Kill" pre-existente.

## [v1.21.3] - 2026-03-22
### Arreglado
- Refactoreo definitivo de validación Multi-Empresa con la super-tabla `Contextos_Usuarios`.
