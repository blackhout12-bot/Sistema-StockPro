const sql = require('mssql');
const logger = require('../utils/logger');

class FacturacionModel {
    async getAllFacturas(pool, empresa_id, sucursal_id = null) {
        // Optimización Senior: Si la migración corrió, la columna existe. Try-Catch nativo para detección robusta.
        let hasSnapshots = false;
        try {
            await pool.request().query("SELECT TOP 1 cliente_nombre_snapshot FROM Facturas");
            hasSnapshots = true;
        } catch (e) { }

        const hasTipo = await pool.request().query("SELECT TOP 1 name FROM sys.columns WHERE object_id = OBJECT_ID('Facturas') AND name = 'tipo_comprobante'").then(r => r.recordset.length > 0);
        const hasOrigen = await pool.request().query("SELECT TOP 1 name FROM sys.columns WHERE object_id = OBJECT_ID('Facturas') AND name = 'origen_venta'").then(r => r.recordset.length > 0);
        const hasSucursal = await pool.request().query("SELECT TOP 1 name FROM sys.columns WHERE object_id = OBJECT_ID('Facturas') AND name = 'sucursal_id'").then(r => r.recordset.length > 0);

        let whereClause = "f.empresa_id = @empresa_id";
        if (hasSucursal && sucursal_id) {
            whereClause += " AND f.sucursal_id = @sucursal_id";
        }

        const query = hasSnapshots
            ? `SELECT f.id, f.nro_factura, f.fecha_emision, f.total, f.estado,
                   ${hasTipo ? 'f.tipo_comprobante,' : "'' as tipo_comprobante,"}
                   ${hasOrigen ? 'f.origen_venta,' : "'' as origen_venta,"}
                   f.moneda, f.tasa_cambio,
                   ISNULL(f.cliente_nombre_snapshot, c.nombre) as cliente_nombre, 
                   ISNULL(f.vendedor_nombre_snapshot, u.nombre) as vendedor_nombre
               FROM Facturas f
               LEFT JOIN Clientes c ON f.cliente_id = c.id
               LEFT JOIN Usuarios u ON f.usuario_id = u.id
               WHERE ${whereClause} ORDER BY f.fecha_emision DESC`
            : `SELECT f.id, f.nro_factura, f.fecha_emision, f.total, f.estado,
                   ${hasTipo ? 'f.tipo_comprobante,' : "'' as tipo_comprobante,"}
                   ${hasOrigen ? 'f.origen_venta,' : "'' as origen_venta,"}
                   f.moneda, f.tasa_cambio,
                   c.nombre as cliente_nombre, u.nombre as vendedor_nombre
               FROM Facturas f
               LEFT JOIN Clientes c ON f.cliente_id = c.id
               LEFT JOIN Usuarios u ON f.usuario_id = u.id
               WHERE ${whereClause} ORDER BY f.fecha_emision DESC`;

        const req = pool.request().input('empresa_id', sql.Int, empresa_id);
        if (hasSucursal && sucursal_id) {
            req.input('sucursal_id', sql.Int, sucursal_id);
        }
        const result = await req.query(query);
        return result.recordset;
    }

    async getFacturaById(pool, id, empresa_id) {
        // Detección Robusta
        let hasSnapshots = false;
        try {
            await pool.request().query("SELECT TOP 1 cliente_nombre_snapshot FROM Facturas");
            hasSnapshots = true;
        } catch (e) { }

        let queryFactura;
        if (hasSnapshots) {
            queryFactura = `
                SELECT f.*,
                       ISNULL(f.cliente_nombre_snapshot, c.nombre) as cliente_nombre,
                       ISNULL(f.cliente_doc_snapshot, c.documento_identidad) as cliente_doc,
                       ISNULL(f.vendedor_nombre_snapshot, u.nombre) as vendedor_nombre,
                       ISNULL(f.empresa_nombre_snapshot, e.nombre) as empresa_nombre_snap,
                       ISNULL(f.empresa_nit_snapshot, e.documento_identidad) as empresa_nit_snap,
                       ISNULL(f.empresa_direccion_snapshot, e.direccion) as empresa_dir_snap,
                       ISNULL(f.empresa_telefono_snapshot, e.telefono) as empresa_tel_snap
                FROM Facturas f
                LEFT JOIN Clientes c ON f.cliente_id = c.id
                LEFT JOIN Usuarios u ON f.usuario_id = u.id
                LEFT JOIN Empresa e ON f.empresa_id = e.id
                WHERE f.id = @id AND f.empresa_id = @empresa_id
            `;
        } else {
            // Fallback sin snapshots
            queryFactura = `
                SELECT f.*, 
                       c.nombre as cliente_nombre,
                       c.documento_identidad as cliente_doc,
                       u.nombre as vendedor_nombre,
                       e.nombre as empresa_nombre_snap,
                       e.documento_identidad as empresa_nit_snap,
                       e.direccion as empresa_dir_snap,
                       e.telefono as empresa_tel_snap
                FROM Facturas f
                LEFT JOIN Clientes c ON f.cliente_id = c.id
                LEFT JOIN Usuarios u ON f.usuario_id = u.id
                LEFT JOIN Empresa e ON f.empresa_id = e.id
                WHERE f.id = @id AND f.empresa_id = @empresa_id
            `;
        }

        const resultFactura = await pool.request()
            .input('id', sql.Int, id)
            .input('empresa_id', sql.Int, empresa_id)
            .query(queryFactura);

        if (resultFactura.recordset.length === 0) return null;
        const factura = resultFactura.recordset[0];

        // Normalizar para el frontend
        if (hasSnapshots) {
            factura.empresa_nombre_snapshot = factura.empresa_nombre_snap;
            factura.empresa_nit_snapshot = factura.empresa_nit_snap;
            factura.empresa_direccion_snapshot = factura.empresa_dir_snap;
            factura.empresa_telefono_snapshot = factura.empresa_tel_snap;
        } else {
            factura.cliente_nombre = factura.cliente_nombre;
            factura.cliente_doc = factura.cliente_doc;
            factura.empresa_nombre_snapshot = factura.empresa_nombre_snap;
            factura.empresa_nit_snapshot = factura.empresa_nit_snap;
            factura.empresa_direccion_snapshot = factura.empresa_dir_snap;
            factura.empresa_telefono_snapshot = factura.empresa_tel_snap;
        }

        // Detalle  
        let queryDetalle;
        if (hasSnapshots) {
            let hasDetalleSnapshot = false;
            try {
                await pool.request().query("SELECT TOP 1 producto_nombre_snapshot FROM Detalle_Facturas");
                hasDetalleSnapshot = true;
            } catch (e) { }

            queryDetalle = hasDetalleSnapshot
                ? `SELECT df.*, ISNULL(df.producto_nombre_snapshot, p.nombre) as producto_nombre
                   FROM Detalle_Facturas df LEFT JOIN Productos p ON df.producto_id = p.id WHERE df.factura_id = @id`
                : `SELECT df.*, p.nombre as producto_nombre FROM Detalle_Facturas df LEFT JOIN Productos p ON df.producto_id = p.id WHERE df.factura_id = @id`;
        } else {
            queryDetalle = `SELECT df.*, p.nombre as producto_nombre FROM Detalle_Facturas df LEFT JOIN Productos p ON df.producto_id = p.id WHERE df.factura_id = @id`;
        }

        const resultDetalle = await pool.request()
            .input('id', sql.Int, id)
            .query(queryDetalle);

        factura.detalles = resultDetalle.recordset;
        return factura;
    }

    async createFactura(pool, facturaData, usuario_id, empresa_id) {
        const { cliente_id, total, detalles } = facturaData;

        // Generar número de factura único (Multi-tenant safe)
        const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        const nro_factura = `F${empresa_id}-${datePart}-${randomPart}`;

        // Obtener Feature Toggles y Detección robusta
        let toggles = {};
        let hasSnapshots = false;
        try {
            const empRes = await pool.request().input('eid', sql.Int, empresa_id).query("SELECT feature_toggles FROM Empresa WHERE id = @eid");
            if (empRes.recordset.length > 0 && empRes.recordset[0].feature_toggles) {
                toggles = JSON.parse(empRes.recordset[0].feature_toggles);
            }
            await pool.request().query("SELECT TOP 1 cliente_nombre_snapshot FROM Facturas");
            hasSnapshots = true;
        } catch (e) { }

        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        const pendingEvents = [];

        try {
            // Validar cliente pertenece a la empresa
            const clienteCheck = await new sql.Request(transaction)
                .input('cli_id', sql.Int, cliente_id)
                .input('emp_id', sql.Int, empresa_id)
                .query('SELECT nombre, documento_identidad FROM Clientes WHERE id = @cli_id AND empresa_id = @emp_id');

            if (clienteCheck.recordset.length === 0) {
                throw new Error('Cliente inválido o no pertenece a tu empresa.');
            }
            const clienteData = clienteCheck.recordset[0];

            // Obtener datos del vendedor
            const vendedorData = await new sql.Request(transaction)
                .input('uid', sql.Int, usuario_id)
                .query('SELECT nombre FROM Usuarios WHERE id = @uid');
            const vendedorNombre = vendedorData.recordset[0]?.nombre || 'Sistema';

            // Obtener datos de empresa
            const empresaData = await new sql.Request(transaction)
                .input('eid', sql.Int, empresa_id)
                .query('SELECT nombre, documento_identidad, direccion, telefono FROM Empresa WHERE id = @eid');
            const emp = empresaData.recordset[0] || {};

            let factura_id;
            let nro_factura_final = nro_factura; // Fallback aleatorio

            // ── NUEVO: OBTENER NUMERACIÓN AUTOMÁTICA POR TENANT ─────────────

            let configResult = await new sql.Request(transaction)
                .input('emp_id', sql.Int, empresa_id)
                .query(`
                    SELECT * 
                    FROM ConfigComprobantes WITH (UPDLOCK, ROWLOCK)
                    WHERE empresa_id = @emp_id AND activo = 1
                `);

            // Si no tiene configuración, crear una por defecto (Senior Self-Healing)
            if (configResult.recordset.length === 0) {
                await new sql.Request(transaction)
                    .input('emp_id', sql.Int, empresa_id)
                    .query(`
                        INSERT INTO ConfigComprobantes (empresa_id, tipo_comprobante, prefijo, proximo_nro, activo)
                        VALUES (@emp_id, 'Factura', '0001', 1, 1)
                    `);
                configResult = await new sql.Request(transaction).input('emp_id', sql.Int, empresa_id).query('SELECT * FROM ConfigComprobantes WHERE empresa_id = @emp_id AND activo = 1');
            }

            // Buscar el tipo solicitado o usar el primero disponible (Senior Logic: Exact Match preferred)
            const tipoSolicitado = facturaData.tipo_comprobante ? facturaData.tipo_comprobante.trim().toLowerCase() : 'factura';
            
            // Prioridad 1: Coincidencia exacta
            let conf = configResult.recordset.find(c => 
                c.tipo_comprobante && c.tipo_comprobante.trim().toLowerCase() === tipoSolicitado
            );

            // Prioridad 2: Coincidencia parcial si no hay exacta
            if (!conf) {
                conf = configResult.recordset.find(c =>
                    c.tipo_comprobante && c.tipo_comprobante.trim().toLowerCase().includes(tipoSolicitado)
                );
            }

            // Prioridad 3: Primero de la lista (Fallback)
            if (!conf) conf = configResult.recordset[0];

            if (conf) {
                const padding = '00000000'; // 8 dígitos de padding
                const numStr = (padding + conf.proximo_nro).slice(-8);
                const letter = (conf.tipo_comprobante || 'F')[0].toUpperCase();
                nro_factura_final = `${letter}${conf.prefijo}-${empresa_id}-${numStr}`;

                // Incrementar para el siguiente uso
                await new sql.Request(transaction)
                    .input('cid', sql.Int, conf.id)
                    .query('UPDATE ConfigComprobantes SET proximo_nro = proximo_nro + 1 WHERE id = @cid');
            } else {
                // Fallback ultra-seguro con letra inicial
                const letter = (facturaData.tipo_comprobante || 'F')[0].toUpperCase();
                const ts = Date.now().toString().slice(-6);
                nro_factura_final = `${letter}${empresa_id}-${datePart}-${ts}${randomPart}`;
            }

            // ── NUEVO: INSERCIÓN RESILIENTE (Detecta columnas en tiempo real) ─────────────
            const factColsExist = await transaction.request().query("SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('Facturas')").then(r => r.recordset.map(c => c.name));
            const detColsExist = await transaction.request().query("SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('Detalle_Facturas')").then(r => r.recordset.map(c => c.name));

            const reqFact = new sql.Request(transaction)
                .input('nro_factura', sql.VarChar(50), nro_factura_final)
                .input('cliente_id', sql.Int, cliente_id)
                .input('usuario_id', sql.Int, usuario_id)
                .input('total', sql.Decimal(10, 2), total)
                .input('empresa_id', sql.Int, empresa_id);

            let factFields = ['nro_factura', 'cliente_id', 'usuario_id', 'total', 'empresa_id'];
            let factValues = ['@nro_factura', '@cliente_id', '@usuario_id', '@total', '@empresa_id'];

            const addFactCol = (col, val, type) => {
                if (factColsExist.includes(col)) {
                    factFields.push(col);
                    factValues.push(`@${col}`);
                    reqFact.input(col, type, val);
                }
            };

            addFactCol('cliente_nombre_snapshot', clienteData.nombre, sql.VarChar(100));
            addFactCol('cliente_doc_snapshot', clienteData.documento_identidad, sql.VarChar(50));
            addFactCol('vendedor_nombre_snapshot', vendedorNombre, sql.VarChar(100));
            addFactCol('empresa_nombre_snapshot', emp.nombre || '', sql.VarChar(100));
            addFactCol('empresa_nit_snapshot', emp.documento_identidad || '', sql.VarChar(50));
            addFactCol('empresa_direccion_snapshot', emp.direccion || '', sql.VarChar(255));
            addFactCol('empresa_telefono_snapshot', emp.telefono || '', sql.VarChar(50));
            addFactCol('tipo_comprobante', conf?.tipo_comprobante || 'Factura', sql.NVarChar);
            addFactCol('metodo_pago', facturaData.metodo_pago || 'Efectivo', sql.NVarChar);
            addFactCol('moneda', facturaData.moneda || 'ARS', sql.NVarChar(10));
            addFactCol('tasa_cambio', facturaData.tasa_cambio || 1.0, sql.Decimal(18, 4));
            addFactCol('origen_venta', facturaData.origen_venta || 'Local', sql.VarChar(50));
            if (facturaData.sucursal_id) {
                addFactCol('sucursal_id', facturaData.sucursal_id, sql.Int);
            }

            const insertFactQuery = `INSERT INTO Facturas (${factFields.join(', ')}) OUTPUT INSERTED.id VALUES (${factValues.join(', ')})`;
            const resultFact = await reqFact.query(insertFactQuery);
            factura_id = resultFact.recordset[0].id;

            // Iterar detalles
            for (const item of detalles) {
                const prodCheck = await new sql.Request(transaction)
                    .input('pid', sql.Int, item.producto_id)
                    .input('eid', sql.Int, empresa_id)
                    .query('SELECT nombre, stock FROM Productos WHERE id = @pid AND empresa_id = @eid');

                if (prodCheck.recordset.length === 0) {
                    const err = new Error(`Producto ID ${item.producto_id} no encontrado.`);
                    err.statusCode = 400;
                    throw err;
                }
                const prod = prodCheck.recordset[0];
                if (prod.stock < item.cantidad) {
                    const err = new Error(`Stock insuficiente para: ${prod.nombre}.`);
                    err.statusCode = 400;
                    throw err;
                }

                const reqDet = new sql.Request(transaction)
                    .input('fid', sql.Int, factura_id)
                    .input('pid', sql.Int, item.producto_id)
                    .input('qty', sql.Int, item.cantidad)
                    .input('price', sql.Decimal(10, 2), item.precio_unitario)
                    .input('sub', sql.Decimal(10, 2), item.subtotal);

                let detFields = ['factura_id', 'producto_id', 'cantidad', 'precio_unitario', 'subtotal'];
                let detValues = ['@fid', '@pid', '@qty', '@price', '@sub'];

                if (detColsExist.includes('producto_nombre_snapshot')) {
                    detFields.push('producto_nombre_snapshot');
                    detValues.push('@pnom');
                    reqDet.input('pnom', sql.VarChar(150), prod.nombre);
                }

                // ── NUEVO: DETERMINAR DEPOSITO Y DESCONTAR ──
                let targetDepositoId = item.deposito_id;
                if (!targetDepositoId) {
                    const reqFallback = new sql.Request(transaction).input('emp_id', sql.Int, empresa_id);
                    let qFallback = 'SELECT TOP 1 id FROM Depositos WHERE empresa_id = @emp_id AND activo = 1';
                    if (facturaData.sucursal_id) {
                        qFallback += ' AND sucursal_id = @suc_id';
                        reqFallback.input('suc_id', sql.Int, facturaData.sucursal_id);
                    } else {
                        qFallback += ' AND es_principal = 1';
                    }
                    const depRes = await reqFallback.query(qFallback);
                    
                    if (depRes.recordset.length > 0) {
                        targetDepositoId = depRes.recordset[0].id;
                    } else {
                        const err = new Error('No se encontró un depósito válido asociado a esta sucursal (o empresa) para descontar stock.');
                        err.statusCode = 400; // Middleware usa statusCode
                        throw err;
                    }
                }

                // Verificar stock en ese depósito específico
                const checkDepStock = await new sql.Request(transaction)
                    .input('pid', sql.Int, item.producto_id)
                    .input('did', sql.Int, targetDepositoId)
                    .query('SELECT cantidad FROM ProductoDepositos WHERE producto_id = @pid AND deposito_id = @did');
                
                let stockEnDeposito = 0;
                
                if (checkDepStock.recordset.length === 0) {
                    // ── SELF-HEALING: El producto no tiene registro de depósito, pero sí stock global ──
                    if (prod.stock > 0) {
                        await new sql.Request(transaction)
                            .input('pid', sql.Int, item.producto_id)
                            .input('did', sql.Int, targetDepositoId)
                            .input('qty', sql.Decimal(18,2), prod.stock)
                            .query('INSERT INTO ProductoDepositos (producto_id, deposito_id, cantidad) VALUES (@pid, @did, @qty)');
                        logger.info({ producto_id: item.producto_id, deposito_id: targetDepositoId, stock: prod.stock }, 'Self-Healing: Regenerado registro de depósito huérfano');
                        stockEnDeposito = prod.stock;
                    }
                } else {
                    stockEnDeposito = checkDepStock.recordset[0].cantidad;
                }

                if (stockEnDeposito < item.cantidad) {
                    const err = new Error(`Stock insuficiente en el depósito elegido para el producto: ${prod.nombre}. (Stock Disp: ${stockEnDeposito})`);
                    err.statusCode = 400;
                    throw err;
                }

                // Descontar del depósito
                await new sql.Request(transaction)
                    .input('pid', sql.Int, item.producto_id)
                    .input('did', sql.Int, targetDepositoId)
                    .input('qty', sql.Decimal(18,2), item.cantidad)
                    .query('UPDATE ProductoDepositos SET cantidad = cantidad - @qty, actualizado_en = GETUTCDATE() WHERE producto_id = @pid AND deposito_id = @did');

                // En el Detalle_Facturas, si existe la columna deposito_id, guardar
                if (detColsExist.includes('deposito_id')) {
                    detFields.push('deposito_id');
                    detValues.push('@did');
                    reqDet.input('did', sql.Int, targetDepositoId);
                }

                const insertDetQuery = `INSERT INTO Detalle_Facturas (${detFields.join(', ')}) VALUES (${detValues.join(', ')})`;
                await reqDet.query(insertDetQuery);


                // ── NUEVO: DESCUENTO POR LOTES (FIFO) ───────────────────────

                let lotCheck = { recordset: [] };
                if (toggles.mod_lotes) {
                    lotCheck = await new sql.Request(transaction)
                        .input('pid', sql.Int, item.producto_id)
                        .input('eid', sql.Int, empresa_id)
                        .query('SELECT id, cantidad, nro_lote FROM Lotes WHERE producto_id = @pid AND empresa_id = @eid AND cantidad > 0 ORDER BY fecha_vto ASC, creado_en ASC');

                    if (lotCheck.recordset.length > 0) {
                        let pendiente = item.cantidad;
                        for (const lote of lotCheck.recordset) {
                            if (pendiente <= 0) break;

                            const aDescontar = Math.min(lote.cantidad, pendiente);
                            await new sql.Request(transaction)
                                .input('lid', sql.Int, lote.id)
                                .input('qty', sql.Int, aDescontar)
                                .query('UPDATE Lotes SET cantidad = cantidad - @qty WHERE id = @lid');

                            pendiente -= aDescontar;

                            // Opcional: Registrar que este lote fue usado (podría ir en una tabla Detalle_Factura_Lotes si fuera necesario)
                            logger.info({ factura_id, producto_id: item.producto_id, lote_id: lote.id, nro_lote: lote.nro_lote, descontado: aDescontar }, 'Descuento de lote FIFO aplicado');
                        }

                        if (pendiente > 0) {
                            // Esto no debería pasar si el stock consolidado es correcto, pero por seguridad:
                            logger.warn({ producto_id: item.producto_id, pendiente }, 'Venta mayor al stock total de lotes. El resto se descontó solo del stock general.');
                        }
                    }
                }

                // Descontar stock general (consolidado)
                await new sql.Request(transaction)
                    .input('pid', sql.Int, item.producto_id)
                    .input('qty', sql.Int, item.cantidad)
                    .input('eid', sql.Int, empresa_id)
                    .query(`UPDATE Productos SET stock = stock - @qty WHERE id = @pid AND empresa_id = @eid`);

                // Registrar movimiento con información de lote (si aplica) (RESILIENTE)
                const movCols = await transaction.request().query("SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('Movimientos')").then(r => r.recordset.map(c => c.name));

                let movFields = ['productoId', 'usuarioId', 'tipo', 'cantidad', 'fecha', 'empresa_id'];
                let movValues = ['@pid', '@uid', "'salida'", '@qty', 'GETDATE()', '@eid'];

                const reqMov = new sql.Request(transaction)
                    .input('pid', sql.Int, item.producto_id)
                    .input('uid', sql.Int, usuario_id)
                    .input('qty', sql.Int, item.cantidad)
                    .input('eid', sql.Int, empresa_id);

                if (lotCheck.recordset.length > 0) {
                    const principalLote = lotCheck.recordset[0];
                    if (movCols.includes('nro_lote')) {
                        movFields.push('nro_lote');
                        movValues.push('@lote');
                        reqMov.input('lote', sql.NVarChar, principalLote.nro_lote || null);
                    }
                }

                if (movCols.includes('deposito_origen_id')) {
                    movFields.push('deposito_origen_id');
                    movValues.push('@depor');
                    reqMov.input('depor', sql.Int, targetDepositoId);
                }

                const insertMovQuery = `INSERT INTO Movimientos (${movFields.join(', ')}) VALUES (${movValues.join(', ')})`;
                await reqMov.query(insertMovQuery);

                // ── NUEVO: DISPARAR NOTIFICACIÓN SI STOCK BAJA DEL MÍNIMO ────
                const stockCheck = await new sql.Request(transaction)
                    .input('pid', sql.Int, item.producto_id)
                    .input('eid', sql.Int, empresa_id)
                    .query(`
                        SELECT stock, nombre,
                               CASE WHEN COL_LENGTH('Productos', 'stock_min') IS NOT NULL THEN stock_min ELSE 0 END as stock_min
                        FROM Productos 
                        WHERE id = @pid AND empresa_id = @eid
                    `);

                const p = stockCheck.recordset[0];
                const globalCritico = emp.inv_stock_critico_global || 5;
                const min = p.stock_min || globalCritico;

                if (p.stock <= min) {
                    const notifRepo = require('./notificacion.repository');
                    await notifRepo.create(transaction, {
                        empresa_id,
                        titulo: 'Stock Crítico',
                        mensaje: `El producto ${p.nombre} ha alcanzado su nivel crítico (${p.stock} unidades).`,
                        tipo: 'warning'
                    });

                    pendingEvents.push({
                        empresa_id,
                        producto_id: item.producto_id,
                        nombre: p.nombre,
                        stock: p.stock
                    });
                }
            }

            await transaction.commit();

            // ── Disparar Eventos asíncronos post-commit ──
            if (pendingEvents.length > 0) {
                const eventBus = require('../events/eventBus');
                for (const evt of pendingEvents) {
                    eventBus.publish('STOCK_BAJO', evt).catch(e => logger.error({ err: e }, 'Error publicando STOCK_BAJO'));
                }
            }

            return factura_id;

        } catch (error) {
            logger.error({ error: error.message, stack: error.stack }, 'Error en createFactura (Transacción bloqueada/fallida)');
            if (transaction) await transaction.rollback();
            throw error;
        }
    }
}

module.exports = new FacturacionModel();
