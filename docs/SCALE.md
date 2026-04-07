# 🚀 Escalabilidad y Gestión de Planes (v1.28.1-fixed)

Este documento detalla la arquitectura de activación/desactivación dinámica de módulos basada en el Plan de Suscripción de la empresa.

## Arquitectura de Control

El sistema implementa un control de acceso de tres capas:
1.  **Capa de Datos**: Cada empresa está vinculada a un `plan_id` en la tabla `Empresa`. La tabla `Planes` define los módulos habilitados en formato JSON.
2.  **Capa de Backend**: El middleware `tenantContext.js` intercepta cada petición a la API. Si la ruta pertenece a un módulo no incluido en el plan, se retorna un `403 Forbidden`.
3.  **Capa de Frontend**: El `moduleRegistry.js` filtra dinámicamente los menús y rutas basándose en los `feature_toggles` que el servidor envía (ya filtrados por el plan).

## Tabla Maestra de Planes

| Plan                | Código | Módulos Habilitados (Propiedades)                                                              |
|---------------------|--------|-------------------------------------------------------------------------------------------------|
| **Retail Básico**   | 1      | `productos`, `categorias`, `movimientos`, `facturacion`, `pos`, `clientes`, `dashboard`        |
| **Logística Avanzada** | 2      | `sucursales`, `proveedores`, `auditoria`, `depositos`, `flotas`, `rutas`, `movimientos`, `dashboard` |
| **Manufactura Pro** | 3      | `produccion`, `calidad`, `ordenes_trabajo`, `kardex`, `productos`, `categorias`, `dashboard`    |
| **Servicios Premium** | 4      | `contratos`, `agenda`, `tickets`, `sla`, `clientes`, `dashboard`                                |
| **Full Enterprise** | 5      | Acceso Total (`*`)                                                                             |

## Seguridad y Resiliencia

### Bloqueo de Endpoints
Si un usuario del plan **Retail Básico** intenta acceder manualmente a `/api/v1/auditoria`, el sistema responderá:
```json
{
  "error": "El módulo 'auditoria' no está incluido en su plan actual (Retail Básico). Contacte a soporte para actualizar su plan."
}
```

### Gestión de Roles
La creación de roles está restringida por el plan. No es posible crear un rol con permisos para un módulo que la empresa no tiene contratado.

### Rollback y Recuperación
En caso de inconsistencias, el sistema soporta la degradación a planes inferiores mediante una actualización simple en la tabla `Empresa`. Los módulos restringidos desaparecerán inmediatamente de la interfaz y la API.
