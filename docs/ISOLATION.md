# Arquitectura de Aislamiento Multi-Tenant — TB Gestión (v1.28.2)

> **Estado**: ✅ PRODUCCIÓN — Implementado, testeado y certificado

## Resumen Ejecutivo

El sistema implementa **aislamiento total de datos por empresa** mediante tres capas complementarias:

| Capa | Mecanismo | Archivo |
|------|-----------|---------|
| Base de Datos | MSSQL Row-Level Security (RLS) | `v1.28.1_isolation_and_plans.sql`, `v1.28.2_complete_rls.sql` |
| Backend | SESSION_CONTEXT + Validación de Plan | `src/middlewares/tenantContext.js` |
| Frontend | Feature Toggles dinámicos | `frontend/src/config/moduleRegistry.js` |

---

## Capa 1: Row-Level Security (MSSQL)

### Cómo Funciona

1. El middleware `tenantContext.js` llama a `sp_set_session_context` al inicio de cada request autenticado:
   ```sql
   EXEC sp_set_session_context @key=N'empresa_id', @value=@eid
   ```
2. La función predicado `Security.fn_securitypredicate(empresa_id)` se evalúa en cada `SELECT`/`INSERT`/`UPDATE`:
   ```sql
   RETURN SELECT 1 WHERE @empresa_id = CAST(SESSION_CONTEXT(N'empresa_id') AS int)
                      OR IS_MEMBER('db_owner') = 1
   ```
3. Las políticas de seguridad filtran automáticamente todas las filas que no pertenecen a la empresa del contexto.

### Tablas Protegidas (v1.28.2)

| Tabla | Política | FILTER | BLOCK INSERT | BLOCK UPDATE |
|-------|----------|--------|-------------|-------------|
| `Productos` | `policy_Productos` | ✅ | ✅ | ✅ |
| `Facturas` | `policy_Facturas` | ✅ | ✅ | ✅ |
| `Clientes` | `policy_Clientes` | ✅ | ✅ | ✅ |
| `Proveedores` | `policy_Proveedores` | ✅ | ✅ | ✅ |
| `Auditoria` | `policy_Auditoria` | ✅ | ✅ | ✅ |
| `Usuarios` | `policy_Usuarios` | ✅ | ❌ | ❌ |

> **Nota sobre Usuarios:** Solo se aplica FILTER (no BLOCK) para no interferir con el proceso de autenticación global (login sin empresa_id en el token inicial).

### Cuenta de Aplicación (Requisito de Producción)

> [!IMPORTANT]
> El usuario de base de datos de la aplicación NO debe ser `db_owner`. Los miembros de `db_owner` bypasean RLS por diseño de MSSQL.
>
> **Configuración recomendada para producción:**
> ```sql
> -- Crear usuario de aplicación sin db_owner
> CREATE LOGIN app_user WITH PASSWORD = 'StrongPass123!';
> CREATE USER app_user FOR LOGIN app_user;
> GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO app_user;
> GRANT EXECUTE ON Security.fn_securitypredicate TO app_user;
> -- NO agregar a db_owner ni db_ddladmin
> ```

---

## Capa 2: Validación de Plan en Backend

### Planes de Suscripción

| ID | Nombre | Módulos Incluidos |
|----|--------|------------------|
| 1 | Retail Básico | productos, categorias, movimientos, facturacion, pos, clientes |
| 2 | Logística Avanzada | sucursales, proveedores, auditoria, depositos, movimientos, productos |
| 3 | Manufactura Pro | produccion, calidad, ordenes_trabajo, kardex, productos, categorias |
| 4 | Servicios Premium | contratos, agenda, tickets, sla, clientes |
| 5 | Full Enterprise | **Todos los módulos** (`"*": true`) |

### Flujo de Validación

```
Request API → tenantContext middleware
  ├── 1. Verifica membresía del usuario en la empresa
  ├── 2. Establece SESSION_CONTEXT (RLS se activa)
  └── 3. Extrae el módulo de la URL (/api/v1/<MODULO>/...)
         ├── Si es módulo core → PASS
         └── Si no es core → consulta Plan contratado
                 ├── módulo habilitado → PASS
                 └── módulo NO habilitado → 403 Forbidden + log en security.log
```

### Módulos Core (siempre permitidos)
`auth`, `empresa`, `dashboard`, `notificaciones`, `perfil`, `configuracion`

---

## Capa 3: Frontend Dinámico

El sidebar y las rutas se construyen dinámicamente basados en los `feature_toggles` que el backend envía:

```javascript
// moduleRegistry.js
export function getAccessibleModules(featureToggles, userRole) {
  // Solo muestra en el menú los módulos habilitados en el plan
  // Si un usuario intenta acceder via URL → redirect al Dashboard
}
```

---

## Arquitectura de Índices de Rendimiento

Los índices compuestos `(empresa_id, id)` aseguran que los filtros RLS sean performantes:

| Tabla | Índice |
|-------|--------|
| `Facturas` | `IDX_Facturas_EmpresaID` |
| `Clientes` | `IDX_Clientes_EmpresaID` |
| `Productos` | `IDX_Productos_EmpresaID` |
| `Proveedores` | `IDX_Proveedores_EmpresaID` |
| `Usuarios` | `IDX_Usuarios_EmpresaID` |
| `Auditoria` | `IDX_Auditoria_EmpresaID` |

---

## Logs de Seguridad

Los intentos de acceso a datos o módulos no autorizados quedan registrados en:
```
logs/security.log
```

Formato del log:
```
[ISO_TIMESTAMP] INTENTO DE ACCESO CRUZADO: Usuario {id} intentó acceder a Empresa {id} desde IP {ip}
[ISO_TIMESTAMP] ACCESO DENEGADO PLAN: Usuario {id} intentó acceder a Módulo {mod} (No incluido en plan {plan})
```

---

## Verificación del Sistema

```bash
# Verificar estado completo de aislamiento
node scripts/test_isolation.js

# Diagnóstico de RLS y Planes
node scripts/diagnose_rls.js
```

### Resultado Esperado
```
RESULTADO FINAL: 25 ✅ PASS | 0 ❌ FAIL
🎉 ÉXITO: Arquitectura de aislamiento multi-tenant validada.
```

---

## Historial de Versiones

| Versión | Fecha | Cambio |
|---------|-------|--------|
| v1.28.1-fixed | 2026-04-07 | Implementación inicial: Planes, ModulosActivos, RLS en Productos |
| v1.28.2 | 2026-04-07 | RLS extendido: Facturas, Clientes, Proveedores, Auditoria, Usuarios |
