# Seguridad Avanzada (v1.27.8)

Este documento detalla el modelo de seguridad, políticas de autenticación y el control de acceso granular implementado en el ERP StockPro.

## 👥 Tabla de Roles y Permisos Granulares

El sistema utiliza un modelo RBAC (Role-Based Access Control) dinámico. A continuación se detallan los roles predefinidos y sus alcances.

| Rol            | Permisos principales                                                                 |
|----------------|--------------------------------------------------------------------------------------|
| Admin          | Acceso total a todos los módulos, gestión de usuarios, roles y auditoría completa    |
| Auditor        | Lectura de todos los registros, acceso a auditoría, sin permisos de escritura        |
| Facturación    | Crear, modificar y listar facturas, acceso a reportes de ventas                      |
| Inventario     | Alta/baja de productos, gestión de stock, acceso a catálogos                         |
| Sucursales     | Gestión de sucursales y delegaciones, acceso a reportes locales                      |
| Seguridad      | Configuración de MFA/TOTP, gestión de accesos y permisos                             |
| Usuario Básico | Acceso limitado a dashboards y reportes públicos                                     |

## 🔐 Políticas de Autenticación

### MFA / TOTP (Multi-Factor Authentication)
- **Algoritmo**: TOTP (Time-based One-Time Password) basado en RFC 6238.
- **Caducidad**: Los tokens tienen una ventana de validez estricta de **30 segundos** (`window: 0`).
- **Implementación**: Se utiliza la librería `speakeasy` para la generación y verificación de secretos.

## 📝 Auditoría y Logs de Acceso

### Logs Estructurados (JSON)
Cada petición HTTP es registrada con los siguientes metadatos críticos para forense:
- `traceId`: Identificador único de la petición para correlación distribuida.
- `userId`: Identificador del usuario autenticado (si aplica).
- `method` / `url`: Path y verbo de la operación.
- `statusCode`: Resultado de la operación.

### Registro de Auditoría
Las acciones críticas (creación de facturas, cambios de roles, accesos denegados) se persisten en la tabla `Auditoria` con el estado de la transacción y el payload (sin datos sensibles).

## ✅ Checklist de Cumplimiento

- [x] MFA/TOTP operativo con caducidad de 30s.
- [x] Roles dinámicos aplicados correctamente vía middleware RBAC.
- [x] Permisos granulares funcionando en módulos críticos.
- [x] Logs JSON con traceId y userId activos.
- [x] Auditoría registra accesos y cambios críticos sin bypass.
