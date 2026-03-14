const { connectDB } = require('./src/config/db');

async function fixSchema() {
    try {
        const pool = await connectDB();
        console.log('--- REFINANDO ESQUEMA Facturas ---');

        const cols = await pool.request().query("SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('Facturas')");
        const colNames = cols.recordset.map(c => c.name.toLowerCase());

        if (!colNames.includes('tipo_comprobante')) {
            console.log('Agregando tipo_comprobante a Facturas...');
            await pool.request().query("ALTER TABLE Facturas ADD tipo_comprobante NVARCHAR(50)");
        }
        if (!colNames.includes('metodo_pago')) {
            console.log('Agregando metodo_pago a Facturas...');
            await pool.request().query("ALTER TABLE Facturas ADD metodo_pago NVARCHAR(50)");
        }

        // Snapshots for Facturas
        if (!colNames.includes('cliente_nombre_snapshot')) {
            console.log('Agregando snapshots a Facturas...');
            await pool.request().query(`
                ALTER TABLE Facturas ADD 
                cliente_nombre_snapshot NVARCHAR(100),
                cliente_doc_snapshot NVARCHAR(50),
                vendedor_nombre_snapshot NVARCHAR(100),
                empresa_nombre_snapshot NVARCHAR(100),
                empresa_nit_snapshot NVARCHAR(50),
                empresa_direccion_snapshot NVARCHAR(255),
                empresa_telefono_snapshot NVARCHAR(50)
            `);
        }

        // Snapshots for Detalle_Facturas
        const detCols = await pool.request().query("SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('Detalle_Facturas')");
        const detColNames = detCols.recordset.map(c => c.name.toLowerCase());
        if (!detColNames.includes('producto_nombre_snapshot')) {
            console.log('Agregando snapshots a Detalle_Facturas...');
            await pool.request().query("ALTER TABLE Detalle_Facturas ADD producto_nombre_snapshot NVARCHAR(150)");
        }

        console.log('Refinamiento de esquema completado.');
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}

fixSchema();
