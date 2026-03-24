const { connectDB } = require('./src/config/db');
const fs = require('fs');

async function audit() {
    try {
        const pool = await connectDB();
        const tables = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
        const tableNames = tables.recordset.map(t => t.TABLE_NAME);
        const targetTables = ['Productos', 'Rubros', 'Empresas', 'Sucursales', 'Depositos', 'Categorias'];
        
        const schemaData = {};
        for (const tbl of targetTables) {
            if (!tableNames.includes(tbl)) continue;
            const schema = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '" + tbl + "'");
            schemaData[tbl] = schema.recordset;
        }
        fs.writeFileSync('schema_output.json', JSON.stringify(schemaData, null, 2));
        console.log('Done!');
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
audit();
