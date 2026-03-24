# Auditoría y Trazabilidad (Extended Audit)

## Descripción General
El módulo de Auditoría registra todas las acciones (creación, edición, eliminación) de las entidades críticas del sistema. Esto garantiza el control, la trazabilidad y la seguridad (compliance).

## Esquema de Base de Datos
La tabla principal es `dbo.Auditoria`.

| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | INT | Identificador único del registro de auditoría. |
| `usuario_id` | INT (NULL) | Referencia al usuario que ejecutó la acción. (NULL cuando es un Trigger de BD si la aplicación no pasa el contexto a System). |
| `ip` | NVARCHAR(50) | Dirección IP desde donde se ejecutó la acción. |
| `timestamp` | DATETIME | Fecha y hora exacta de la modificación. (Default: `GETDATE()`). |
| `accion` | NVARCHAR(100) | Tipo de acción (e.g., `INSERT`, `UPDATE`, `DELETE`, `CREAR_PRODUCTO`). |
| `entidad` | NVARCHAR(100) | Nombre lógico de la entidad afectada (e.g., `Productos`, `Facturas`, `API`). |
| `entidad_id` | INT (NULL) | ID del registro físico afectado en la respectiva tabla. |
| `valor_anterior` | NVARCHAR(MAX) | Snapshot JSON del estado anterior a la modificación. (En DELETE o UPDATE). |
| `valor_nuevo` | NVARCHAR(MAX) | Snapshot JSON del estado final tras la modificación (En INSERT o UPDATE). (Anteriormente llamado `payload`). |
| `empresa_id` | INT | Identificador del Tenant para mantener el aislamiento de datos (SaaS Multi-Tenant). |

## Triggers Activos en Base de Datos
Para evitar que manipulaciones manuales bypassen el sistema de logs a nivel de aplicación, se han implementado Logical Triggers en SQL Server:
- `trg_audit_Productos`: Audita inventario general.
- `trg_audit_Facturas`: Audita emisión y anulación de facturas.
- `trg_audit_Compras`: Audita abastecimiento.
- `trg_audit_Proveedores`: Audita maestros financieros.
- `trg_audit_Usuarios`: Audita cuentas y accesos.
- `trg_audit_Roles`: Audita escalamiento de privilegios o cambios en el RBAC.
- `trg_audit_PreciosSucursal`: Audita los cambios dinámicos de asignación de precios.

*Nota:* Los triggers registran operaciones CRUD puras con `accion: 'INSERT', 'UPDATE', 'DELETE'`. Las acciones registradas desde el Backend pueden tener nomenclaturas de negocio especializadas (ej. `LOGIN_SUCCESS`, `CIERRE_CAJA_FORZADO`).

## Ejemplos de Logs
### Action Insert (Application Code)
\`\`\`json
{
  "usuario_id": 2,
  "ip": "192.168.1.10",
  "accion": "CREAR_USUARIO",
  "entidad": "Usuarios",
  "entidad_id": 4,
  "valor_nuevo": "{\"nombre\":\"Juan\",\"rol\":\"vendedor\"}"
}
\`\`\`

### Action Update via DB Trigger
\`\`\`json
{
  "usuario_id": null,
  "ip": null,
  "accion": "UPDATE",
  "entidad": "Productos",
  "entidad_id": 105,
  "valor_anterior": "{\"id\":105,\"precio\":100.50,\"empresa_id\":1}",
  "valor_nuevo": "{\"id\":105,\"precio\":150.00,\"empresa_id\":1}"
}
\`\`\`

## Endpoint de Consulta
- **URL**: `GET /api/v1/auditoria`
- **Permisos**: Restringido al rol `admin`. *(A nivel de middleware de autenticación y controller check)*.
- **Filtros Soportados (Query Params)**:
  - `limit`: (Number) Límite de registros. (Default: 100).
  - `fechaInicio`: YYYY-MM-DD
  - `fechaFin`: YYYY-MM-DD
  - `entidad`: (String) Permite filtrar por entidades exactas ej. `Productos`.
  - `usuario_id`: (ID) Filtra los eventos concretos generados por ese ID.

## Frontend Exportable
La página principal de Auditoría permite visualizar estos registros, incluyendo vistas parseadas de los JSON `valor_anterior` y `valor_nuevo`. Además soporta la exportación deshidratada y completa en los siguientes formatos:
1. **CSV**: Datos separados por coma (aptos para análisis en Excel/Calc).
2. **Markdown**: Formato estructurado para compartición técnica o publicación de trazabilidad.
