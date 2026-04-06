# Resiliencia y Recuperación ante Desastres (v1.27.9)

Este documento detalla los procedimientos de Contingencia (DRP) y Resiliencia operativa del ERP StockPro.

## 🛡️ Estrategia de Snapshots (Pre-Deploy)

Antes de cada despliegue o cambio crítico en la estructura de datos, se debe generar un snapshot físico de la base de datos.

### Procedimiento Manual (Windows)
```powershell
.\scripts\db_backup.ps1
```
Este script genera un archivo `.bak` en la carpeta `./backups` y actualiza la copia `StockDB_safe.bak` utilizada por el sistema de rollback automático.

---

## 🔄 Rollback Automático (CI/CD)

El pipeline de GitHub Actions (`production-deploy.yml`) está configurado para detectar fallos en la fase de auditoría post-despliegue.

### Flujo de Rollback
1. El despliegue falla o la auditoría devuelve un código de error.
2. GitHub Actions dispara el step `failure()`.
3. Se ejecuta `scripts/rollback.sh`.
4. El sistema revierte al **último tag de Git estable**.
5. Se restaura la base de datos desde `StockDB_safe.bak`.

---

## 🆘 Recuperación Manual (Breaking Glass)

En caso de fallo catastrófico no detectado por el CI/CD, siga estos pasos:

### 1. Revertir Código (Git)
Identificar el último tag estable (ej. `v1.27.8`) y realizar el checkout:
```bash
git checkout tags/v1.27.8
```

### 2. Restaurar Base de Datos (SQL Server)
Ejecutar el comando de restauración desde el backup "safe":
```sql
USE master;
ALTER DATABASE [StockDB] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
RESTORE DATABASE [StockDB] FROM DISK = 'C:\Users\regar0\stock-system\backups\StockDB_safe.bak' WITH REPLACE;
ALTER DATABASE [StockDB] SET MULTI_USER;
```

---

## 📈 Monitoreo de Disponibilidad

El sistema utiliza Prometheus para vigilar la salud del servicio.

| Alerta | Disparador | Acción Recomendada |
|---|---|---|
| **ServiceDown** | `up == 0` | Verificar estado del proceso Node.js / PM2. |
| **HighErrorRate** | `errors > 5%` | Revisar logs de `pino-http` buscando el `traceId`. |

---

## ✅ Checklist de Resiliencia

- [x] Snapshots DB operativos vía `sqlcmd`.
- [x] Rollback Git integrado en el flujo de trabajo.
- [x] Alertas de caída configuradas en la documentación de observabilidad.
- [x] Procedimientos de desastre documentados y accesibles.
