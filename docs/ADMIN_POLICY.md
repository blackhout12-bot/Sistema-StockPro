## Política de Administración Global (v1.28.2-apply)

*   **Bypass de Seguridad**: El superadmin bypasséa validaciones de empresa y plan automáticamente mediante el middleware `tenantContext.js`. Al ser un rol global, posee acceso irrestricto mediante el wildcard `['*']`.
*   **Gestión de Planes**: El cambio de plan invalida cache y regenera toggles en el backend. Esto asegura que la próxima solicitud de cualquier usuario de la empresa afectada sea procesada con el nuevo contexto de plan.
*   **Propagación en Frontend**: Los usuarios de empresa verán el nuevo plan en su próxima request (o tras refrescar voluntariamente la vista), sin necesidad de logout forzado, gracias a la invalidación de la sesión en caché y al refresco dinámico de `featureToggles`.

---
## Evidencia de Validación (v1.28.2-tests)

Se han implementado y ejecutado exitosamente los siguientes conjuntos de pruebas:
*   **E2E Backend**: Validación de login superadmin, bypass de seguridad en middleware `tenantContext` y `RBAC`, y propagación de cambios de plan en BD.
*   **UI Frontend**: Validación de la reactividad del componente `SuperAdmin`, asegurando que `moduleRegistry` y `AuthContext` se actualicen instantáneamente al modificar una licencia.

*Documentación aplicada para la fase v1.28.2-superadmin-panel-restore-tests.*

---
## Premisas Finales de Operación (v1.28.2-final)

1.  **Bypass Estricto**: El superadmin bypasséa todas las validaciones de empresa y plan en el middleware `tenantContext.js`.
2.  **Señalización Global**: El login del superadmin devuelve explícitamente el flag `panel: global`, activando el estado `isSuperAdmin` en el frontend.
3.  **Propagación de Plan**: Cualquier cambio de plan realizado desde el panel global invalida la cache en Redis y regenera los `feature_toggles` inmediatamente.
4.  **Experiencia sin Fricción**: Los administradores de las empresas afectadas heredarán el nuevo plan en su próxima petición o refresco visual, sin requerir re-autenticación.

*Documentación final aplicada para la fase v1.28.2-superadmin-panel-restore-final.*

---
## Conexión Extendida Backend-Frontend (v1.28.2-connect-frontend)

*   "El login del superadmin devuelve flag `panel: global`."
*   "El frontend usa ese flag para renderizar el panel `SuperAdmin.jsx`."
*   "El cambio de plan invalida cache y regenera toggles, reflejándose en frontend sin logout forzado."

---
## Descripciones de Módulos Dinámicos (v1.28.3-superadmin-panel-descriptions-modules)

*   "Cada plan tiene nombre, descripción y módulos asociados."
*   "El superadmin puede ver y modificar planes desde su panel global."
*   "Los cambios se propagan en tiempo real a admins y usuarios de la empresa."

---
## Gestión Maestra de Datos y Eliminación en Cascada (v1.29.7-superadmin-delete-cascade-fix)

*   **Eliminación Atómica**: El superadmin puede eliminar empresas junto con todos sus datos asociados (usuarios, sucursales, depósitos y cajas). La eliminación es atómica y se realiza en una sola transacción para asegurar la integridad.
*   **Integridad Referencial**: Se ha instrumentado `ON DELETE CASCADE` en la relación `Sucursal -> Depositos` para garantizar la limpieza automática de la infraestructura local al eliminar un nodo superior.
*   **Backup Holístico**: Cada eliminación de empresa genera un snapshot completo en `Backup_Eliminaciones` que incluye no solo la entidad empresa, sino también sus usuarios, sucursales y depósitos.
*   **Rollback Jerárquico**: El sistema de rollback ha sido mejorado para restaurar el árbol completo de dependencias en el orden correcto, manteniendo los IDs originales mediante `IDENTITY_INSERT`.
*   **Trazabilidad**: Todas las acciones de eliminación y restauración quedan registradas en la Auditoría Global con el detalle de las sub-entidades afectadas y el `backupId` asociado.

---
## Reglas de Rol y Permisos (v1.29.9-superadmin-permissions-delete-fix)

1. **SuperAdmin Global**: El superadmin no pertenece a ninguna empresa (`empresa_id = NULL`).
2. **Acceso Total**: El superadmin tiene acceso global exclusivo a empresas, usuarios, planes y auditoría de todo el sistema.
3. **Observabilidad Maestral**: El dashboard del superadmin muestra métricas agregadas de todo el ecosistema.
4. **Control de Ciclo de Vida**: El panel de gestión del superadmin permite la eliminación en cascada de entidades, cambios de plan y ejecución de rollbacks de integridad.
5. **Aislamiento Administrativo**: El administrador de empresa solo puede gestionar y visualizar datos pertenecientes a su `empresa_id`.
6. **Restricción de Operador**: El usuario regular tiene acceso limitado a las funcionalidades habilitadas por el plan de suscripción de su empresa.
