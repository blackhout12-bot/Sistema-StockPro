# Informe de Refactorización y Deuda Técnica: StockPro

**Tipo Reporte:** Auditoría de Calidad de Código y Mantenibilidad
**Alcance:** Backend, Frontend, Estructura de Controladores y Logs.

Este informe se enfoca en detectar "olores de código" (code smells), deuda técnica y problemas menores que, de no atenderse, ralentizarán el desarrollo de nuevas funciones (Go-To-Market) y dificultarán la detección de errores (Troubleshooting).

---

## 1. Deuda Técnica y Errores Menores Encontrados

### 1.1. Validaciones Dispersas y Duplicadas (Backend)
*   **El Problema:** Actualmente, la lógica de negocio y las validaciones de entrada (`req.body`, `req.params`) están mezcladas dentro de los Controladores.
    *   *Ejemplo Actual:* Múltiples bloques `if (!nombre) return res.status(400).json(...)` diseminados a mano en cada ruta.
*   **Impacto a Largo Plazo:** Altísima propensión a olvidar validar campos en el futuro, inyecciones de datos corruptos a la BD y un código espagueti difícil y largo de leer. Cada nuevo desarrollador invertirá tiempo escribiendo "ifs" repetidos en lugar de lógica de valor.

### 1.2. Logs sin Estructura y "Console.logs" Basura (Backend / Frontend)
*   **El Problema:** Existen aproximadamente 35 llamadas a `console.log()` y `console.error()` crudos a lo largo del backend (migraciones, `sso.controller.js`, `importacion.controller.js`) y al menos un console.log de payload en el frontend (`AuditLogs.jsx`).
*   **Impacto a Largo Plazo:** Cuando la aplicación esté en K8s, enviar logs al Output Estandar crudo impedirá parsear errores de forma estructurada. Si quieres filtrar en Grafana "Dame todos los errores de MercadoPago nivel ERROR del usuario X", con `console.log` es literalmente imposible.

### 1.3. Reglas de Linter Evasivas (Frontend)
*   **El Problema:** En el archivo `AuthContext.jsx` existe un flag `// eslint-disable-line` para puentear las advertencias de dependencias en un bloque `useEffect`.
*   **Impacto a Largo Plazo:** Ignorar dependencias en hooks de React es la causa número uno de bugs de estado (stale closures), memory leaks y renders infinitos. 

---

## 2. Refactorización Propuesta (Ejemplos Prácticos)

### 2.1. Arquitectura de Validación Centralizada (Recomendación: Zod + Express)
Se debe abstraer toda revisión del `Body` hacia Middlewares genéricos.

*   **Paso 1: Definir el Esquema (Zod)**
    ```javascript
    // src/schemas/producto.schema.js
    const { z } = require('zod');
    
    const crearProductoSchema = z.object({
      nombre: z.string().min(3),
      precio: z.number().positive(),
      stock: z.number().int().nonnegative().default(0),
      sku: z.string().optional()
    });
    ```
*   **Paso 2: Crear Middleware Global**
    ```javascript
    // src/middlewares/validator.middleware.js
    const validate = (schema) => (req, res, next) => {
      try {
        req.body = schema.parse(req.body); // Retorna los datos saneados (sin campos basura extra)
        next();
      } catch (error) {
        return res.status(400).json({ status: 'error', errors: error.errors });
      }
    };
    ```
*   **Paso 3: Limpiar el Controlador**
    ```javascript
    // src/routes/productos.js
    router.post('/', validate(crearProductoSchema), productosController.crearProducto);
    // El controlador ahora asume CERO responsabilidad de validación.
    ```

### 2.2. Manejo de Logs Estructurados (Recomendación: Pino Logger)
Evitar `console.log` utilizando Winston o Pino, con un formato JSON unificado.

*   **Implementación Base:**
    ```javascript
    // src/utils/logger.js
    const pino = require('pino');
    
    const logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      formatters: {
        level: (label) => { return { level: label.toUpperCase() }; }
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    });
    
    module.exports = logger;
    ```
*   **Uso:**
    ```javascript
    // En lugar de console.error(err):
    logger.error({ userId: req.user.id, action: 'importacion_masiva', error: err.message }, 'Fallo en importación');
    ```

### 2.3. Sanear Reglas de ESLint
En lugar de evadir la regla:
1. Re-ordenar la lógica o envolver las funciones externas dentro de `useCallback()`.
2. Actualizar las dependencias del array con lo devuelto por `useCallback()`, asegurando que el Hook esté completamente blindado contra re-renders accidentales de memoria.

---

## 3. Plan de Corrección Incremental (Cero Fricción al Negocio)

El objetivo de un buen plan de refactorización es "Limpiar mientras avanzas" (Boy Scout Rule), sin detener meses el desarrollo de nuevas características.

#### Fase 1: Prevención Inmediata (Semana 1)
*   **Añadir Linters al CI:** Integrar `eslint` en `.github/workflows/cd-pipeline.yml` para qué bloquee cualquier PR o commit que agregue un nuevo `console.log` o un nuevo `eslint-disable`. Así detienes la *hemorragia*.
*   **Instancia Global de Logger:** Configurar `Pino` (que ya viene parcial en `server.js` con `pinoHttp`) de forma aislada e importar ese `logger.js` en vez de `console`. Hacer un Search & Replace general de `console.error` a `logger.error`.

#### Fase 2: Transición de Rutas Clave (Mes 1)
*   **Identificar Top 5 Endpoints:** Buscar las 5 rutas con mayor escritura (Ej: Crear Factura, Crear Producto, Login, Registro) e implementar Zod exclusivamente en esas iteraciones.
*   **Refactor de Oportunidad:** Decretar como regla de equipo que: *"Si tocas un controlador por una nueva historia de usuario, debes migrar sus `ifs` de validación a Zod antes de enviar el PR"*.

#### Fase 3: Homologación Completa (Mes 2-3)
*   **Consolidar Middlewares de Errores Globales:** Eliminar todos los `try-catch` de los controladores inyectándolos a través de un envoltorio `asyncHandler` estándar de express, enviando todos los errores no capturados a un logger central e instando un Rollbar / Sentry.
*   **Resolución ESLint Frontend:** Destinar 4 horas de un Sprint exclusivamente para levantar los Warnings del Frontend y auditar el renderizado cíclico del Context.
