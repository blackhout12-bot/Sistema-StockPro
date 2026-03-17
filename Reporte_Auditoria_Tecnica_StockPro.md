# Reporte Técnico Integral: StockPro

**Tipo Reporte:** Auditoría Técnica de Código y Arquitectura
**Alcance:** Backend, Frontend, Base de Datos, CI/CD.

A continuación, se presenta un desglose exhaustivo de los fallos identificados en la base de código, organizados por criticidad e impacto, junto con la ruta de mitigación obligatoria antes de operar a gran escala.

---

## 1. Errores Críticos Detectados (Severidad Alta)

### 1.1. Vulnerabilidades de Inyección SQL en Scripts (Seguridad)
*   **Hallazgo:** Existen múltiples scripts operativos (ej. `src/reset-password.js`, `src/add-categoria.js`) que construyen sentencias SQL concatenando literales de variables directamente al string (`INSERT INTO Usuarios (..., email, ...) VALUES (..., '${email}', ...)`).
*   **Impacto [Crítico]:** Aunque actualmente residen en scripts de sistema/CLI y no en el API público, este patrón representa una vulnerabilidad *SQL Injection (SQLi)* de manual. Si alguna vez esa función se exporta o reusa, permitirá a atacantes secuestrar o borrar toda la base de datos.
*   **Solución:** Modificar *todos* los scripts para utilizar el método parametrizado `.input('param', type, value).query('... @param')` que se usa correctamente en los repositorios modernos.

### 1.2. Cuellos de Botella de Rendimiento (Base de Datos)
*   **Hallazgo:** En `producto.repository.js` (y similares), las consultas como `getAll` e `getPaginated` incluyen *Subqueries* correlacionadas masivas en el bloque SELECT (ej. `SELECT p.*, ISNULL((SELECT SUM(cantidad) FROM Movimientos m WHERE m.productoId = p.id AND m.tipo = 'salida'), 0) as num_ventas`).
*   **Impacto [Alto]:** Una subconsulta correlacionada se evalúa *por cada fila*. Si la empresa tiene 5,000 productos y 100,000 movimientos, esta consulta destrozará el CPU y la memoria de Postgres/SQL Server provocando bloqueos de tabla.
*   **Solución:** Mover estas lógicas a vistas pre-calculadas (Materalized Views / Index Views), usar `JOINs` con agrupaciones `GROUP BY` centralizadas, o crear trabajos en lote que mantengan un campo `num_ventas` físico actualizado.

### 1.3. Riesgo de Falta de `Liveness` en Deploy (CI/CD)
*   **Hallazgo:** El pipeline actual (`cd-pipeline.yml`) hace la prueba de humo mediante `kubectl get pods | grep Running`.
*   **Impacto [Medio-Alto]:** Que un Pod de Node.js esté "Running" no garantiza que pueda conectar a la base de datos, simplemente indica que el proceso V8 arrancó. Esto significa que un deploy defectuoso podría no desencadenar el rollback automáticamente si falla la conectividad.
*   **Solución:** Añadir Liveness/Readiness probes en el chart de Helm que ataquen a `http://localhost:5000/health` requiriendo un HTTP 200, provocando que Kubernetes impida direccionar tráfico si el sistema está roto.

---

## 2. Errores Menores y Deuda de Calidad (Severidad Media/Baja)

### 2.1. Validaciones Dispersas (Calidad Backend)
*   **Hallazgo:** La validación de los datos que ingresan al sistema (Body params) se efectúa de forma manual mediante condicionales `if (!req.body.name)` desparramados en los controladores.
*   **Impacto [Medio]:** Aumenta drásticamente la duplicación de código, disminuye la legibilidad y eleva la probabilidad de obviar validaciones críticas, causando _data corruption_.
*   **Solución (Refactor):** Implementar un middleware unificado y global utilizando esquemas tipados como `Zod` o `Joi` (`const validate = (schema) => (req) => schema.parse(req.body)`).

### 2.2. Manejo de Errores y Tracking (Logs y Mantenibilidad)
*   **Hallazgo:** Hay más de 30 apariciones de `console.log()` crudos en el código de backend (Especialmente en migraciones, scripts base y `Auth/SSO`). En controladores se usa `console.error(err)`.
*   **Impacto [Menor]:** Un `console.log` síncrono ensucia la terminal del contenedor y es imposible de auditar estructuradamente. El manejo de errores actual rompe el principio DRY, obligando a usar `try-catch` repetitivos en todas las funciones.
*   **Solución:** 
    - (A) Instalar `Pino` o `Winston` para enviar los logs estructurados (.json) que Elastic / Loki puedan analizar.
    - (B) Crear un **Global Error Handler Middleware** para Express, que intercepte y unifique los `try-catch`.

### 2.3. Exhaustividad Lint del Frontend
*   **Hallazgo:** El frontend es, de forma opuesta, bastante riguroso en calidad. Se detectó 1 excepción al Linter de dependencias de React: `// eslint-disable-line` en `AuthContext.jsx`. Además de un solitario console.log parseando un payload en `AuditLogs.jsx`.
*   **Impacto [Bajo]:** Deshabilitar dependencias de `useEffect` suele ocultar comportamientos asíncronos peligrosos e inconsistencias sutiles si el componente se monta rápido.

---

## 3. Matriz de Entregables y Priorización de Acción

Este es el orden con el cual te recomiendo arreglemos tu código si deseas seguir iterando sobre esto, del más crítico al de mejora continua:

| Prioridad | Área | Tarea/Corrección Inmediata a implementar | Impacto / Riesgo de no hacerlo |
| :--- | :--- | :--- | :--- |
| **P1** | Base de Datos | **Remover Subqueries (Correlacionadas):** Reescribir las consultas dentro de los Repositorios Core (`productos`, `movimientos`) que calculen en línea usando `SUM()`. | Caída total del sistema por sobre-saturación del Pool de BD ante tráfico concurrente en Producción. |
| **P2** | Seguridad | **Eliminar Raw Queries:** Revisión de todo el repositorio por interpolación `${variable}` dentro de funciones SQL adaptándolas a parámetros nativos de Sqlite/MSSql/PG. | Posibilidad latente de inyección maliciosa o borrado de la aplicación. |
| **P3** | Infra / CI-CD | **Helm HealthChecks:** Modificar el chart K8s y el endpoint de `/health` para validar que realmente se alcanzan Redis, DB y colas AFIP e inyectarlo en Liveness. | Falsos positivos de Rollback, tráfico enrutado a Nodos colapsados. |
| **P4** | Estilo Arquitectónico| **Global Error Catcher & Zod:** Migrar validaciones a un middleware único. | Costo de desarrollo por las nubes en los sprints del futuro y mantenibilidad tortuosa. |
