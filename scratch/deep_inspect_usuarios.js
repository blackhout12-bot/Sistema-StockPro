const { connectDB, sql } = require('../src/config/db');

async function run() {
    try {
        const pool = await connectDB();
        console.log('--- Buscando dependencias reales de Usuarios.empresa_id ---');
        
        const res = await pool.request().query(`
            SELECT 
                i.name AS IndexName,
                c.name AS ColumnName,
                i.type_desc
            FROM sys.indexes i
            INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
            INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
            WHERE i.object_id = OBJECT_ID('Usuarios')
            AND c.name = 'empresa_id';
        `);
        console.log('Indices on empresa_id:', res.recordset);

        const res2 = await pool.request().query(`
            SELECT 
                cc.name AS ConstraintName,
                c.name AS ColumnName,
                cc.definition
            FROM sys.check_constraints cc
            INNER JOIN sys.columns c ON cc.parent_object_id = c.object_id AND cc.parent_column_id = c.column_id
            WHERE cc.parent_object_id = OBJECT_ID('Usuarios')
            AND c.name = 'empresa_id';
        `);
        console.log('Check Constraints:', res2.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
