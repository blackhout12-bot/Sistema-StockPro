# Protocolo de Rollback Automatizado (TB Gestión - v1.20.0)

Este documento describe la arquitectura de resiliencia automatizada inyectada en el CI/CD y los pasos a seguir ante catástrofes de despliegue en ambientes productivos.

## 1. Topología Automática Post-Despliegue

Cada vez que el pipeline de GitHub Actions despliega un nuevo container (vía Helm Kubernetes o Docker), queda una ventana de **Auto-Restauración (Self-Healing)** acoplada.

### Disparadores de Rollback Automáticos
*   **Pipeline Smoke Test:** Tras subir los nuevos Pods, el archivo `.github/workflows/cd-pipeline.yml` inyecta un test de humo de la salud del clúster. Si los contenedores caen en CrashLoop, acciona `./scripts/rollback.sh`.
*   **Alertas de Prometheus (`observability/prometheus/alerts.yml`):**
    *   `ErrorRateHigh`: Activación automática ante más del 5% de HTTP 5XX durante 1 minuto.
    *   `POSNodeDisconnected`: Dispara rollback si los nodos de facturación principal están caídos (`up == 0`).

## 2. Uso del Script de Rollback (Containers)
> Ubicación: `scripts/rollback.sh`

Este bash interroga recursivamente al entorno (Kubernetes + Helm vs Docker Compose). 
- Si halla `helm`, obtiene la release históricamente anterior y fuerza a K8s con `helm rollback stock-system 0 --wait`. 
- Si halla Docker Compose, apaga los contenedores defectuosos locales y reconstruye inmediatamente con la tag de imagen `:stable` respaldada con antelación.

## 3. Estrategia de Rollback: Bases de Datos
> Ubicación: `scripts/rollback_db.js`

Por principio de sistemas transaccionales-ERP, NO es recomendable aplicar caídas destructivas de columnas (`DOWN` migrations) si el esquema ya se alteró e incluyó facturación paralela.
Se han proveído dos variables maestras (por `$env:RESTORE_MODE`):

| Modo | Comando / Estrategia | Escenario de uso |
| :--- | :--- | :--- |
| **SCRIPT_DOWN** | Aplica los queries inversos (`rollback_latest.sql`). | Migración fresca que no impactó datos reales post-deploy. |
| **SNAPSHOT** | Restaura de forma "Hard" un archivo `.bak` (Snapshot DCR). | Caída completa de integridad de la base de datos por un deploy masivo contaminado. Usa transacciones únicas T-SQL `WITH ROLLBACK IMMEDIATE`. |

## Seguridad y Auditoría
Toda manipulación documentada de versiones (`Helm history`) ha sido protegida. Al ejecutarse una corrección de Prometheus hacia el GitOps CI/CD, el sistema notificará inmediatamente al Canal Maestro a los roles "Admin", previniendo que futuras subidas destruyan más infraestructura operativa.
