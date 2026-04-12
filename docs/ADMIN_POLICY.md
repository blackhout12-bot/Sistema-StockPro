# Administración: Política de SuperAdmin y Planes
v1.28.2-superadmin-plan-propagation

Esta política define el comportamiento del sistema para SuperAdministradores y la gestión de planes de suscripción.

## 1. Acceso SuperAdmin (Bypass)

El rol `superadmin` es un rol global que no está vinculado a una empresa específica por defecto. 

- **Middleware**: El sistema aplica un bypass explícito en `tenantContext.js`.
- **Permisos**: Los SuperAdministradores reciben automáticamente un plan `FULL` y todos los feature toggles (`['*']`).
- **Seguridad**: Este bypass permite gestionar la plataforma, crear empresas, asignar planes y realizar auditorías globales sin restricciones de tenant.

## 2. Gestión de Planes y Feature Toggles

El acceso a los módulos de la aplicación está determinado por el plan asignado a la empresa (`Empresa.plan_id`).

### Propagación de Cambios
Cuando un SuperAdministrador cambia el plan de una empresa:
1. **Base de Datos**: Se actualiza el campo `plan_id` en la tabla `Empresa`.
2. **Invalidación de Cache**: Se eliminan las llaves de cache relacionadas en Redis (`empresa:{id}` y `empresa:plan:{id}`).
3. **Feature Toggles**: El backend regenera dinámicamente el objeto de `feature_toggles` basado en los módulos habilitados del nuevo plan.
4. **Sincronización UI**: El frontend recibe los nuevos toggles y los aplica inmediatamente a través del `moduleRegistry`, permitiendo que el administrador de la empresa vea los cambios sin necesidad de cerrar sesión.

## 3. Validación de Plan (Real-Time)

Para garantizar la estabilidad y evitar discrepancias entre el estado de la suscripción y el acceso real:
- El sistema realiza una **consulta directa del plan** a la base de datos en cada request.
- No se utiliza cache persistente para la validación de planes en el middleware de contexto de tenant.

---
*TB Gestión ERP - Documentación de Arquitectura*
