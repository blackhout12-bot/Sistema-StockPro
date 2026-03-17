const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Readable } = require('stream');
const csv = require('csv-parser');
const sql = require('mssql');
const { connectDB } = require('../../config/db');
const checkPermiso = require('../../middlewares/rbac');
const audit = require('../../middlewares/audit');
const logger = require('../../utils/logger');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

/**
 * Importar Productos vía CSV
 * CSV Expected Columns: sku, nombre, descripcion, categoria, precio, stock, stock_min
 */
router.post('/productos', checkPermiso('productos', 'crear'), audit('crear', 'Importacion Masiva Productos'), upload.single('file'), async (req, res, next) => {
    if (!req.file) return res.status(400).json({ error: 'No se envió ningún archivo CSV.' });

    const results = [];
    const stream = Readable.from(req.file.buffer);

    stream.pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            if (results.length === 0) return res.status(400).json({ error: 'El archivo CSV está vacío.' });

            const pool = await connectDB();
            const transaction = new sql.Transaction(pool);

            try {
                await transaction.begin();

                // Dynamic Column Check
                const hasSkuStr = "SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('Productos')";
                const colsResult = await transaction.request().query(hasSkuStr);
                const tableCols = colsResult.recordset.map(c => c.name);

                let rowsInserted = 0;
                let rowsUpdated = 0;

                // Obtain Default Deposito for Stock Synchronization
                let defaultDepositoId = null;
                const depRes = await transaction.request()
                    .input('emp_id', sql.Int, req.tenant_id)
                    .query('SELECT TOP 1 id FROM Depositos WHERE empresa_id = @emp_id AND es_principal = 1 AND activo = 1');
                if (depRes.recordset.length > 0) defaultDepositoId = depRes.recordset[0].id;

                for (const row of results) {
                    const nombre = row.nombre?.trim();
                    if (!nombre) continue; // Skip empty names

                    const sku = row.sku?.trim() || null;
                    const desc = row.descripcion?.trim() || '';
                    const cat = row.categoria?.trim() || 'General';
                    const precio = parseFloat(row.precio) || 0;
                    const stock = parseInt(row.stock, 10) || 0;
                    const stock_min = parseInt(row.stock_min, 10) || 0;

                    // Verify if SKU exists for update
                    let existingId = null;
                    if (sku && tableCols.includes('sku')) {
                        const exCheck = await transaction.request()
                            .input('sku', sql.NVarChar, sku)
                            .input('emp_id', sql.Int, req.tenant_id)
                            .query('SELECT id FROM Productos WHERE sku = @sku AND empresa_id = @emp_id');
                        if (exCheck.recordset.length > 0) existingId = exCheck.recordset[0].id;
                    }

                    if (existingId) {
                        // Update
                        let updateQ = 'UPDATE Productos SET nombre = @nombre, descripcion = @descripcion, categoria = @cat, precio = @precio, stock = stock + @stock ';
                        if (tableCols.includes('stock_min')) updateQ += ', stock_min = @smin ';
                        updateQ += ' WHERE id = @id';

                        const reqUpdate = transaction.request()
                            .input('id', sql.Int, existingId)
                            .input('nombre', sql.NVarChar, nombre)
                            .input('descripcion', sql.NVarChar, desc)
                            .input('cat', sql.NVarChar, cat)
                            .input('precio', sql.Decimal(12, 2), precio)
                            .input('stock', sql.Int, stock);

                        if (tableCols.includes('stock_min')) reqUpdate.input('smin', sql.Int, stock_min);
                        await reqUpdate.query(updateQ);
                        rowsUpdated++;

                        // Add imported stock to default warehouse if exists
                        if (defaultDepositoId && stock > 0) {
                            await transaction.request()
                                .input('pid', sql.Int, existingId)
                                .input('did', sql.Int, defaultDepositoId)
                                .input('qty', sql.Decimal(18,2), stock)
                                .query(`
                                    IF EXISTS (SELECT 1 FROM ProductoDepositos WHERE producto_id=@pid AND deposito_id=@did)
                                        UPDATE ProductoDepositos SET cantidad = cantidad + @qty WHERE producto_id=@pid AND deposito_id=@did
                                    ELSE
                                        INSERT INTO ProductoDepositos (producto_id, deposito_id, cantidad) VALUES (@pid, @did, @qty)
                                `);
                        }

                    } else {
                        // Insert
                        let insertFields = ['nombre', 'descripcion', 'categoria', 'precio', 'stock', 'empresa_id'];
                        let insertVals = ['@nombre', '@descripcion', '@cat', '@precio', '@stock', '@emp_id'];
                        const reqIns = transaction.request()
                            .input('nombre', sql.NVarChar, nombre)
                            .input('descripcion', sql.NVarChar, desc)
                            .input('cat', sql.NVarChar, cat)
                            .input('precio', sql.Decimal(12, 2), precio)
                            .input('stock', sql.Int, stock)
                            .input('emp_id', sql.Int, req.tenant_id);

                        if (sku && tableCols.includes('sku')) {
                            insertFields.push('sku');
                            insertVals.push('@sku');
                            reqIns.input('sku', sql.NVarChar, sku);
                        }
                        if (tableCols.includes('stock_min')) {
                            insertFields.push('stock_min');
                            insertVals.push('@smin');
                            reqIns.input('smin', sql.Int, stock_min);
                        }

                        const insertQ = `INSERT INTO Productos (${insertFields.join(', ')}) OUTPUT INSERTED.id VALUES (${insertVals.join(', ')})`;
                        const resIns = await reqIns.query(insertQ);
                        const newId = resIns.recordset[0].id;
                        rowsInserted++;

                        // Add imported stock to default warehouse if exists
                        if (defaultDepositoId) {
                            await transaction.request()
                                .input('pid', sql.Int, newId)
                                .input('did', sql.Int, defaultDepositoId)
                                .input('qty', sql.Decimal(18,2), stock)
                                .query('INSERT INTO ProductoDepositos (producto_id, deposito_id, cantidad) VALUES (@pid, @did, @qty)');
                        }
                    }
                }

                await transaction.commit();
                res.status(200).json({ message: 'Importación completada', creados: rowsInserted, actualizados: rowsUpdated });
            } catch (err) {
                if (transaction) await transaction.rollback();
                logger.error({ error: err.message }, 'Error importando productos');
                res.status(500).json({ error: 'Error interno o formato CSV inválido. Consulte soporte.' });
            }
        });
});

/**
 * Importar Clientes vía CSV
 * Expected Columns: documento_identidad, nombre, tipo_documento, email, telefono, direccion
 */
router.post('/clientes', checkPermiso('clientes', 'crear'), audit('crear', 'Importacion Masiva Clientes'), upload.single('file'), async (req, res, next) => {
    if (!req.file) return res.status(400).json({ error: 'No se envió ningún archivo CSV.' });

    const results = [];
    const stream = Readable.from(req.file.buffer);

    stream.pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            if (results.length === 0) return res.status(400).json({ error: 'El archivo CSV está vacío.' });

            const pool = await connectDB();
            const transaction = new sql.Transaction(pool);

            try {
                await transaction.begin();

                let rowsInserted = 0;
                let rowsUpdated = 0;

                for (const row of results) {
                    const nombre = row.nombre?.trim();
                    const doc = row.documento_identidad?.trim();
                    
                    if (!nombre || !doc) continue; // Skip invalid

                    const tipo_doc = row.tipo_documento?.trim() || 'DNI';
                    const email = row.email?.trim() || '';
                    const tel = row.telefono?.trim() || '';
                    const dir = row.direccion?.trim() || '';

                    // Check if exists
                    const exCheck = await transaction.request()
                        .input('doc', sql.VarChar, doc)
                        .input('emp_id', sql.Int, req.tenant_id)
                        .query('SELECT id FROM Clientes WHERE documento_identidad = @doc AND empresa_id = @emp_id');

                    if (exCheck.recordset.length > 0) {
                        const existingId = exCheck.recordset[0].id;
                        await transaction.request()
                            .input('id', sql.Int, existingId)
                            .input('nombre', sql.VarChar, nombre)
                            .input('tipo', sql.VarChar, tipo_doc)
                            .input('email', sql.VarChar, email)
                            .input('tel', sql.VarChar, tel)
                            .input('dir', sql.VarChar, dir)
                            .query('UPDATE Clientes SET nombre=@nombre, tipo_documento=@tipo, email=@email, telefono=@tel, direccion=@dir WHERE id=@id');
                        rowsUpdated++;
                    } else {
                        await transaction.request()
                            .input('doc', sql.VarChar, doc)
                            .input('nombre', sql.VarChar, nombre)
                            .input('tipo', sql.VarChar, tipo_doc)
                            .input('email', sql.VarChar, email)
                            .input('tel', sql.VarChar, tel)
                            .input('dir', sql.VarChar, dir)
                            .input('emp_id', sql.Int, req.tenant_id)
                            .query('INSERT INTO Clientes (documento_identidad, nombre, tipo_documento, email, telefono, direccion, empresa_id) VALUES (@doc, @nombre, @tipo, @email, @tel, @dir, @emp_id)');
                        rowsInserted++;
                    }
                }

                await transaction.commit();
                res.status(200).json({ message: 'Importación completada', creados: rowsInserted, actualizados: rowsUpdated });
            } catch (err) {
                if (transaction) await transaction.rollback();
                logger.error({ error: err.message }, 'Error importando clientes');
                res.status(500).json({ error: 'Error interno o formato CSV inválido.' });
            }
        });
});

module.exports = router;
