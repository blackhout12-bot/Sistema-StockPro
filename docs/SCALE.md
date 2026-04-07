# StockPro ERP - Escalamiento y Planes (v1.28.1)

Este documento detalla el sistema de activación y desactivación de módulos por plan implementado en la versión v1.28.1.

## Arquitectura de Planes

El sistema utiliza un esquema Multi-Tenant donde cada **Empresa** está vinculada a un **Plan**. El plan define estrictamente qué módulos son visibles en el Frontend y cuáles endpoints están habilitados en el Backend.

### Tabla de Planes (v1.28.1)

| Plan                | Módulos habilitados                                      | Descripción                                         |
|---------------------|-----------------------------------------------------------|-----------------------------------------------------|
| **Retail Básico**   | Inventario, Facturación, POS                              | Ideal para comercios individuales y minoristas.    |
| **Logística Avanzada** | Flotas, Rutas, Depósitos, Auditoría                    | Gestión de transporte y control de stock avanzado.  |
| **Manufactura Pro** | Producción (MRP), Calidad, Órdenes de trabajo             | Control de procesos de fabricación y ensamblaje.   |
| **Servicios Premium** | Contratos, Agenda, Tickets, SLA                         | Para empresas orientadas a servicios y soporte.     |
| **Full Enterprise** | Todos los módulos activos                                 | Acceso ilimitado a todas las funcionalidades.       |

## Aplicación Técnica

### 1. Validación en Backend (Seguridad)
El middleware `tenantContext` valida el `req.originalUrl` contra los permisos del plan de la empresa. Si un usuario intenta acceder a un endpoint de un módulo no incluido en su plan, el sistema devuelve un error `403 Forbidden`.

### 2. Visibilidad en Frontend (UX)
El `moduleRegistry.js` filtra los módulos cargados en el menú lateral basándose en el objeto `featureToggles` (derivado del plan) que el backend envía al iniciar sesión o cambiar de contexto.

### 3. Roles y Permisos Dinámicos
Los roles asignados a los usuarios están supeditados a la disponibilidad del módulo en el plan. Aunque un rol tenga permiso para "Auditoría", si el plan de la empresa no incluye dicho módulo, el acceso será denegado a nivel de sistema.

---
*Confirmación de Versión: v1.28.1*
