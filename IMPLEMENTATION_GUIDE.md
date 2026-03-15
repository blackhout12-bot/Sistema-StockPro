# Guía de Implementación de Mitigaciones 🛡️

Esta guía define la estrategia de remediación para las vulnerabilidades detectadas en el sistema **StockPro ERP**.

## 1. Fases de Ejecución

### Fase 1: Respuesta Inmediata (Hoy)
Foco en cerrar puertas críticas que exponen el entorno de producción.
- **Fix CORS**: Configurar variables de entorno y bloquear orígenes dinámicos.
- **Fix SQL**: Habilitar `encrypt: true` y rotar credenciales.
- **Fix CI/CD**: Migrar todos los hardcodes hacia `GitHub Secrets`.
- **Fix JWT**: Migrar de `localStorage` a `HttpOnly Cookies`.
- **Fix CSP**: Encender la `Content Security Policy` en Helmet.

### Fase 2: Fortalecimiento (Semana 1)
- Refactorizar las políticas RBAC y validaciones perimetrales.
- Revisar persistencia de sesiones en Redis.

### Fase 3: Mantenimiento (Semanas 2-3)
- Validar sanitización de variables (evitar SQL Injection y XSS puro).
- Actualizar dependencias de Node detectadas por `npm audit`.

## 2. Checklist de Despliegue Crítico
- [ ] Entorno local replicando el parche de CORS (verificar que React sigue conectando).
- [ ] Aplicar parche en base de datos (`encrypt: true`).
- [ ] Implementar la inyección manual de `Set-Cookie` en el handler principal de Login.
- [ ] Actualizar Axios Frontend `withCredentials: true` para que reciba la Cookie.

## 3. Testing
**Validación estática:**
Correr `npm audit` y `snyk test`.
**Validación dinámica (SAST/DAST):**
Ejecutar la suite Vitest E2E (`npm run test tests/`) para verificar que los cambios de seguridad no rompieron las APIs de Facturación ni el Dashboard.

## 4. Plan de Rollback (Automático)
Si el frontend deja de autenticar por XSS rules o CORS estrictos:
```bash
# Volver inmediatamente a la rama funcional
git reset --hard HEAD~1
git push origin main --force
# Reanudar la refactorización en una rama 'hotfix/security'
git checkout -b hotfix/security
```
