const { connectDB } = require('./src/config/db');
const sql = require('mssql');

async function finalMigrate() {
    try {
        const pool = await connectDB();
        console.log('Iniciando migración crítica...');

        const addCol = async (table, col, type) => {
            const has = await pool.request().query(`SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('${table}') AND name = '${col}'`).then(r => r.recordset.length > 0);
            if (!has) {
                console.log(`Agregando ${col} a ${table}...`);
                await pool.request().query(`ALTER TABLE ${table} ADD ${col} ${type}`);
            } else {
                console.log(`${col} ya existe en ${table}.`);
            }
        };

        // 1. Movimientos
        await addCol('Movimientos', 'nro_lote', 'NVARCHAR(50) NULL');
        await addCol('Movimientos', 'fecha_vto', 'DATE NULL');

        // 2. Facturas
        await addCol('Facturas', 'tipo_comprobante', 'NVARCHAR(50) NULL');
        await addCol('Facturas', 'metodo_pago', 'NVARCHAR(50) NULL');
        await addCol('Facturas', 'cliente_nombre_snapshot', 'NVARCHAR(150) NULL');
        await addCol('Facturas', 'cliente_doc_snapshot', 'NVARCHAR(50) NULL');
        await addCol('Facturas', 'vendedor_nombre_snapshot', 'NVARCHAR(150) NULL');
        await addCol('Facturas', 'empresa_nombre_snapshot', 'NVARCHAR(150) NULL');
        await addCol('Facturas', 'empresa_nit_snapshot', 'NVARCHAR(50) NULL');
        await addCol('Facturas', 'empresa_direccion_snapshot', 'NVARCHAR(255) NULL');
        await addCol('Facturas', 'empresa_telefono_snapshot', 'NVARCHAR(50) NULL');

        // 3. Detalle_Facturas
        await addCol('Detalle_Facturas', 'producto_nombre_snapshot', 'NVARCHAR(150) NULL');

        // 4. Productos (Reintento por si acaso)
        await addCol('Productos', 'sku', 'NVARCHAR(100) NULL');
        await addCol('Productos', 'stock_min', 'INT DEFAULT 0');

        console.log('Migración finalizada con éxito.');
        process.exit(0);
    } catch (e) {
        console.error('Error en migración:', e.message);
        process.exit(1);
    }
}
finalMigrate();
