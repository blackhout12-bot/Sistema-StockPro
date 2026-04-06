const { connectDB } = require('./src/config/db');
const sql = require('mssql');

async function checkDatabase() {
    try {
        const pool = await connectDB();
        
        console.log('--- Verificando Índices ---');
        const indices = await pool.request().query(`
            SELECT 
                 t.name AS Table_Name,
                 i.name AS Index_Name,
                 i.type_desc AS Index_Type
            FROM 
                 sys.indexes i
            INNER JOIN 
                 sys.tables t ON i.object_id = t.object_id
            WHERE 
                 i.name = 'IDX_Facturacion_Sucursal'
        `);
        console.log('Indices found:', indices.recordset);

        console.log('\n--- Verificando Triggers ---');
        const triggers = await pool.request().query(`
            SELECT 
                name,
                parent_class_desc,
                is_disabled
            FROM sys.triggers
            WHERE parent_id = OBJECT_ID('Facturas') OR parent_id = OBJECT_ID('Detalle_Facturas')
        `);
        console.log('Triggers found:', triggers.recordset);

        console.log('\n--- Verificando Esquema Facturas ---');
        const schema = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Facturas'
        `);
        console.log('Columns in Facturas:', schema.recordset.map(c => c.COLUMN_NAME).join(', '));

        process.exit(0);
    } catch (err) {
        console.error('Error checking database:', err);
        process.exit(1);
    }
}

checkDatabase();
