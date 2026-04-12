# Política de Administración Global (v1.28.2)

## 1. Rol SuperAdmin
El SuperAdmin es el rol de mayor jerarquía en la plataforma. Posee capacidades de supervisión global y gestión de inquilinos (Tenants).

### Identificación
- El sistema reconoce los roles `superadmin` en el payload del JWT.
- En el backend, el middleware `tenantContext.js` aplica un bypass inmediato.

### Capacidades Especiales
- **Bypass de Tenant**: No está restringido a una sola empresa (`req.tenant_id = null`).
- **Acceso Total**: Posee el wildcard `*` en feature toggles, lo que habilita todos los módulos dinámicamente en el frontend.
- **Gestión de Planes**: Acceso exclusivo al **Panel SuperAdmin** para la reasignación de niveles de suscripción.

## 2. Propagación de Cambios de Plan
Para asegurar que un cambio de plan se refleje sin necesidad de relogin:
1. **Persistencia**: Se actualiza `plan_id` en la tabla `Empresa`.
2. **Invalidación**: Se elimina el estado previo de la empresa en Redis mediante `deleteCache("empresa:{id}")`.
3. **Sincronización**: El endpoint devuelve los nuevos `feature_toggles` que se inyectan en el `localStorage` y en el estado global del frontend mediante `moduleRegistry.update()`.

## 3. Restricciones de Seguridad
- El acceso superadmin está prohibido para usuarios estándar o administradores de empresa.
- Ninguna operación de superadmin debe comprometer la integridad de los datos aislados entre empresas (RLS), excepto para la visualización de metadatos de gestión.

---
*Documentación generada para la fase v1.28.2-superadmin-panel-restore.*
