const { connectDB } = require('./src/config/db');
const sql = require('mssql');

async function migrate() {
    try {
        const pool = await connectDB();
        console.log('Iniciando migración de esquema para Productos...');

        // 1. Agregar SKU si falta
        const hasSku = await pool.request().query("SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Productos') AND name = 'sku'").then(r => r.recordset.length > 0);
        if (!hasSku) {
            console.log('Agregando columna [sku] a Productos...');
            await pool.request().query("ALTER TABLE Productos ADD sku NVARCHAR(100) NULL");
        }

        // 2. Agregar stock_min si falta
        const hasStockMin = await pool.request().query("SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Productos') AND name = 'stock_min'").then(r => r.recordset.length > 0);
        if (!hasStockMin) {
            console.log('Agregando columna [stock_min] a Productos...');
            await pool.request().query("ALTER TABLE Productos ADD stock_min INT DEFAULT 0");
            await pool.request().query("UPDATE Productos SET stock_min = 0 WHERE stock_min IS NULL");
        }

        // 3. Agregar stock_max si falta
        const hasStockMax = await pool.request().query("SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Productos') AND name = 'stock_max'").then(r => r.recordset.length > 0);
        if (!hasStockMax) {
            console.log('Agregando columna [stock_max] a Productos...');
            await pool.request().query("ALTER TABLE Productos ADD stock_max INT NULL");
        }

        console.log('Migración completada exitosamente.');
        process.exit(0);
    } catch (e) {
        console.error('Error durante la migración:', e.message);
        if (e.originalError) console.error('Detalle:', e.originalError.message);
        process.exit(1);
    }
}

migrate();
