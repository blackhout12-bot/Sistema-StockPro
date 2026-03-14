const { connectDB, sql } = require('./src/config/db');

async function audit() {
    let pool;
    try {
        pool = await connectDB();
        
        console.log('--- AUDITORÍA DE CLAVES ÚNICAS ---');

        // 1. Ver índices y constraints de Facturas
        console.log('\n[1] Índices en Facturas:');
        const indexes = await pool.request().query(`
            SELECT 
                i.name AS IndexName,
                c.name AS ColumnName
            FROM sys.indexes i
            INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
            INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
            WHERE i.object_id = OBJECT_ID('Facturas')
        `);
        console.table(indexes.recordset);

        // 2. Buscar facturas con números duplicados (en toda la base o por empresa)
        console.log('\n[2] Facturas con nro_factura duplicados:');
        const dupFacturas = await pool.request().query(`
            SELECT nro_factura, COUNT(*) as cantidad
            FROM Facturas
            GROUP BY nro_factura
            HAVING COUNT(*) > 1
        `);
        console.table(dupFacturas.recordset);

        // 3. Ver estado de ConfigComprobantes
        console.log('\n[3] Estado de ConfigComprobantes:');
        const configs = await pool.request().query(`SELECT * FROM ConfigComprobantes`);
        console.table(configs.recordset);

        // 4. Verificar si el proximo_nro de ConfigComprobantes ya existe en Facturas
        console.log('\n[4] Cruce Configuración vs Facturas (Colisiones potenciales):');
        for (const conf of configs.recordset) {
            const padding = '00000000';
            const numStr = (padding + conf.proximo_nro).slice(-8);
            const letter = (conf.tipo_comprobante || 'F')[0].toUpperCase();
            const predicted = `${letter}${conf.prefijo}-${conf.empresa_id}-${numStr}`;
            
            const collision = await pool.request()
                .input('pred', sql.VarChar, predicted)
                .query('SELECT id, nro_factura FROM Facturas WHERE nro_factura = @pred');
            
            if (collision.recordset.length > 0) {
                console.log(`⚠️ COLISIÓN DETECTADA: El próximo número ${predicted} YA EXISTE en Facturas (ID: ${collision.recordset[0].id})`);
            } else {
                console.log(`✅ OK: El próximo número ${predicted} está libre.`);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

audit();
