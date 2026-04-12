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
## Pureza del Rol SuperAdmin (v1.29.3-superadmin-role-fix)

*   "El superadmin no pertenece a ninguna empresa (empresa_id = NULL/Global)."
*   "El superadmin tiene acceso global a todas las empresas, usuarios, planes y auditoría sin restricciones de tenant."
*   "El dashboard del superadmin muestra exclusivamente métricas globales de plataforma, nunca métricas de una sola empresa."
*   "El panel de gestión del superadmin permite eliminar empresas y usuarios, cambiar planes y ejecutar rollback de forma centralizada."

---
## Dashboard vs Gestión Operativa (v1.29.2)

*   "El superadmin utiliza el Dashboard Global para visualizar métricas agregadas."
*   "La gestión operativa se realiza exclusivamente desde el Panel de Gestión Operativa."
