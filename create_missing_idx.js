const { connectDB } = require('./src/config/db');
const sql = require('mssql');

async function createIndex() {
    try {
        const pool = await connectDB();
        console.log('Creando el índice IDX_Facturacion_Sucursal...');
        
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_Facturacion_Sucursal' AND object_id = OBJECT_ID('Facturas'))
            BEGIN
                CREATE NONCLUSTERED INDEX [IDX_Facturacion_Sucursal]
                ON [dbo].[Facturas] ([sucursal_id], [fecha_emision])
                INCLUDE ([id], [nro_factura], [total], [estado]);
                PRINT 'Índice IDX_Facturacion_Sucursal creado exitosamente.';
            END
            ELSE
            BEGIN
                PRINT 'El índice IDX_Facturacion_Sucursal ya existe.';
            END
        `);
        
        process.exit(0);
    } catch (err) {
        console.error('Error al crear el índice:', err);
        process.exit(1);
    }
}

createIndex();
