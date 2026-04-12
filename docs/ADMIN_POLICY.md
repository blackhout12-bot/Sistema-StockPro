## Política de Administración Global (v1.28.2-apply)

*   **Bypass de Seguridad**: El superadmin bypasséa validaciones de empresa y plan automáticamente mediante el middleware `tenantContext.js`. Al ser un rol global, posee acceso irrestricto mediante el wildcard `['*']`.
*   **Gestión de Planes**: El cambio de plan invalida cache y regenera toggles en el backend. Esto asegura que la próxima solicitud de cualquier usuario de la empresa afectada sea procesada con el nuevo contexto de plan.
*   **Propagación en Frontend**: Los usuarios de empresa verán el nuevo plan en su próxima request (o tras refrescar voluntariamente la vista), sin necesidad de logout forzado, gracias a la invalidación de la sesión en caché y al refresco dinámico de `featureToggles`.

---
*Documentación aplicada para la fase v1.28.2-superadmin-panel-restore-apply.*
