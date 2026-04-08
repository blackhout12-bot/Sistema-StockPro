# Política de Administración y Roles — TB Gestión ERP
**Versión:** v1.28.2-superadmin-plan-sync  
**Fecha:** 2026-04-08  
**Clasificación:** Confidencial — Solo personal técnico y operativo autorizado

---

## 1. Arquitectura de Roles

El sistema TB Gestión implementa tres niveles de acceso con responsabilidades claramente delimitadas:

| Rol | Alcance | empresa_id | Descripción |
|-----|---------|------------|-------------|
| `superadmin` | **Global** (toda la plataforma) | Referencia (no restrictivo) | Administrador global del sistema. Ve y gestiona todas las empresas. |
| `admin` | **Empresa** (su tenant) | Obligatorio | Administrador de una empresa específica. Ve su plan y módulos. |
| `*` (otros) | **Empresa** (según RBAC) | Obligatorio | Roles operativos con permisos granulares por módulo. |

---

## 2. SuperAdministrador Global

### 2.1 Definición
El SuperAdministrador es una cuenta a nivel **plataforma**, no a nivel empresa. Su función principal es:
- Gestionar el catálogo de empresas y sus planes
- Reasignar planes de suscripción con **sincronización inmediata**
- Acceder a estadísticas globales de la plataforma
- Operar sobre cualquier empresa sin restricciones

### 2.2 Sincronización Inmediata (v1.28.2-fix)
Cuando un SuperAdministrador cambia el plan de una empresa:
1. Se actualiza el `plan_id` en la base de datos inmediatamente. El cambio de plan invalida cache y regenera toggles.
2. Se invalida el caché de Redis para esa empresa (`empresa:plan:ID`).
3. El middleware `tenantContext` detecta la invalidación y recarga el nuevo plan en el siguiente request. El admin verá reflejado el nuevo plan en su panel inmediatamente.
4. El superadmin bypasséa validaciones de empresa y plan. El frontend del SuperAdmin distribuye un evento de sincronización para actualizar menús y toggles dinámicamente si está en ese contexto.

### 2.3 Credenciales Iniciales


> [!CAUTION]
> Las credenciales iniciales deben cambiarse en el primer login. La cuenta tiene `must_change_password = 1` activado.

```
Email:    superadmin@tbgestion.local
Password: SuperAdmin2026!
Rol:      superadmin
```

### 2.4 Política de Credenciales

- **Rotación mínima**: Cada 90 días en producción
- **Complejidad**: Mínimo 16 caracteres, letras, números y símbolos
- **MFA obligatorio en producción**: TOTP via aplicación (Google Authenticator, Authy)
- **Acceso**: Exclusivamente desde IPs autorizadas (whitelist en firewall/reverse proxy)
- **Sesión**: No compartir el token JWT con nadie

### 2.5 Restricciones
- El superadmin **no debe usarse** para operaciones cotidianas — solo para administración del sistema
- Cada acción del superadmin queda registrada en `logs/security.log`
- En producción, el acceso debe protegerse con MFA/TOTP (ver sección 5)

---

## 3. Administrador de Empresa (`admin`)

### 3.1 Definición
El administrador de empresa gestiona un tenant específico. Sus permisos incluyen:
- Ver y actualizar datos de su empresa
- Gestionar usuarios de su empresa
- Ver el plan activo y los módulos habilitados
- Configurar roles y permisos RBAC internos

### 3.2 Visibilidad del Plan
Desde `Empresa → Mi Plan`, el administrador puede:
- Ver el nombre del plan contratado
- Ver la lista de módulos habilitados
- Solicitar un upgrade enviando un email a soporte

### 3.3 Restricciones
- Un admin **no puede** ver datos de otras empresas (RLS activo)
- Un admin **no puede** acceder al Panel SuperAdmin
- Un admin **no puede** cambiar su plan directamente — debe solicitarlo a soporte

---

## 4. Diferencias Clave: Admin vs SuperAdmin

| Función | admin | superadmin |
|---------|-------|------------|
| Ver datos propios de su empresa | ✅ | ✅ (con contexto de empresa) |
| Ver datos de TODAS las empresas | ❌ | ✅ |
| Cambiar plan de su empresa | ❌ | ✅ |
| Gestionar usuarios de su empresa | ✅ | ✅ |
| Acceso al Panel SuperAdmin | ❌ | ✅ |
| Bypass de tenant context (RLS) | ❌ | ✅ |
| Acceso a todos los módulos | ❌ (limitado por plan) | ✅ |

### Ejemplo de Acceso Permitido/Restringido

```
┌─────────────────────────────────────────────────────────────┐
│ GET /api/v1/empresa/plan                                      │
│                                                               │
│ admin (empresa 5):                                            │
│   → X-Empresa-Id: 5                                          │
│   → Respuesta: plan de empresa 5 ✅                          │
│                                                               │
│ admin (empresa 5) intenta acceder a empresa 7:               │
│   → X-Empresa-Id: 7                                          │
│   → 403 Forbidden (sin membresía en empresa 7) ❌            │
│                                                               │
│ superadmin:                                                   │
│   → X-Empresa-Id: 7 (opcional)                              │
│   → Respuesta: plan de empresa 7 ✅ (bypass total)           │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. MFA para SuperAdmin (Producción)

> [!IMPORTANT]
> En producción, el acceso del superadmin debe protegerse con autenticación de dos factores (2FA/TOTP).

El sistema ya soporta TOTP (Google Authenticator). Para habilitarlo para el superadmin:

```sql
-- Verificar si el superadmin tiene MFA habilitado
SELECT id, email, mfa_enabled, totp_secret 
FROM Usuarios WHERE rol = 'superadmin';
```

Para activar MFA: iniciar sesión como superadmin → Perfil → Seguridad → Activar Autenticador.

---

## 6. Endpoints de SuperAdmin

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/superadmin/empresas` | Lista todas las empresas + plan activo |
| GET | `/api/v1/superadmin/planes` | Lista todos los planes del sistema |
| POST | `/api/v1/superadmin/changePlan` | Cambio de plan con invalidación de caché (Sincro Inmediata) |
| PUT | `/api/v1/superadmin/empresas/:id/plan` | Reasigna plan a una empresa (Legacy) |
| GET | `/api/v1/superadmin/stats` | Estadísticas globales de la plataforma |
| GET | `/api/v1/empresa/plan` | Plan del tenant actual (admin + superadmin) |


---

## 7. Seguridad: Aislamiento de Datos (RLS)

La función `tenantContext.js` implementa la siguiente jerarquía:

```
Si rol == 'superadmin'  → Bypass total, next()
Si rol == 'admin'       → Verificar membresía + plan + RLS
Si rol == otros         → Verificar membresía + plan + RBAC granular + RLS
```

El bypass de superadmin es correcto y seguro porque:
- El middleware `requireSuperAdmin` en cada ruta de superadmin verifica el rol antes de ejecutar
- El token JWT está firmado con la clave `JWT_SECRET`
- Todas las acciones quedan en `logs/security.log`

---

## 8. Recomendaciones de Seguridad para Producción

1. **Cuenta de aplicación**: El usuario de BD debe ser `StockAppUser` con permisos limitados (sin `db_owner`) para que el RLS sea efectivo.
2. **MFA**: Habilitar TOTP para la cuenta superadmin.
3. **IP Whitelist**: Restringir acceso desde IPs autorizadas.
4. **Rotación de contraseñas**: Cada 90 días mínimo.
5. **Auditoría**: Integrar `logs/security.log` en stack de observabilidad (OpenTelemetry/Grafana).
6. **Backup**: Hacer backup del secreto TOTP antes de activar MFA.
