const { connectDB } = require('./src/config/db');
const sql = require('mssql');
const fs = require('fs');

async function checkDatabase() {
    try {
        const pool = await connectDB();
        const results = {};
        
        const indices = await pool.request().query(`
            SELECT t.name AS Table_Name, i.name AS Index_Name, i.type_desc AS Index_Type
            FROM sys.indexes i
            INNER JOIN sys.tables t ON i.object_id = t.object_id
            WHERE i.name = 'IDX_Facturacion_Sucursal'
        `);
        results.indices = indices.recordset;

        const triggers = await pool.request().query(`
            SELECT name, parent_class_desc, is_disabled
            FROM sys.triggers
            WHERE parent_id = OBJECT_ID('Facturas') OR parent_id = OBJECT_ID('Detalle_Facturas')
        `);
        results.triggers = triggers.recordset;

        const schemaFacturas = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Facturas'
        `);
        results.columnsFacturas = schemaFacturas.recordset.map(c => c.COLUMN_NAME);

        const schemaDetalle = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Detalle_Facturas'
        `);
        results.columnsDetalle = schemaDetalle.recordset.map(c => c.COLUMN_NAME);

        fs.writeFileSync('db_check_results.json', JSON.stringify(results, null, 2));
        console.log('Results written to db_check_results.json');
        process.exit(0);
    } catch (err) {
        console.error('Error checking database:', err);
        process.exit(1);
    }
}

checkDatabase();
