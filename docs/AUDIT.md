# Listas de Control de Auditoría Reproductible (AUDIT)

Para reproducir fielmente un escenario de bug o para transicionar un módulo del ambiente "Staging" al ambiente "Producción", cualquier operador debe certificar estas condiciones mínimas por pilar:

## 1. Módulo Operacional y Facturaciones (POS)
| Requisito | Acción de Validación (Humana o Test) |
| :--- | :--- |
| **Integridad Transaccional** | Producir una venta forzando el inventario a números negativos (esperando un error nativo de Constraint `CK_Stock_Positivo`). |
| **Autenticación Multi-Contexto** | Cambiar el Combo de Empresa Activa a la Sucursal B (El Kardex de la Sucursal A deberá desaparecer fulminantemente y en su lugar aparecerá el Stock Cero). |

## 2. Escalabilidad y Prevención de Desastres Kubernetes
| Requisito | Acción de Validación (SRE) |
| :--- | :--- |
| **Limites Anti OOM-Kill** | Embolsar un Array JSON masivo consumiendo toda la RAM del FrontEnd K8S, esperando a que el Container lance un Reboot con flag `OOMKilled`. |
| **Auto-Reversión CI/CD** | Someter deliberadamente al flujo un error 500 y verificar cómo el script de Pipeline arroja un `helm rollback` a la *Release ID* inmediatamente anterior al fracaso. |

## 3. Módulo de Redes Confidenciales (Delegaciones Temporales)
| Requisito | Acción de Validación (Operador/Gerente) |
| :--- | :--- |
| **Elasticidad Permanente** | Cargar al Payload backend una delegación con `fecha_fin: null` confirmando que NO se inyecten "EPARAMS Invalid Dates". |
| **Protección contra Escalada de Privilegios** | Autenticarse con `rol = supervisor` e intentar inyectar en REST/Insomnia una Delegación transfiriendo el `rol_asignado = admin`. Se espera Status `403`. |
