const { connectDB } = require('./src/config/db');
const sql = require('mssql');

async function debugBillingDeep() {
    try {
        const pool = await connectDB();
        console.log('--- AUDITORÍA DE ESQUEMA PARA FACTURACIÓN ---');

        const checkCol = async (table, col) => {
            const res = await pool.request().query(`SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('${table}') AND name = '${col}'`);
            return res.recordset.length > 0;
        };

        const factCols = ['id', 'nro_factura', 'cliente_id', 'usuario_id', 'fecha_emision', 'total', 'estado', 'empresa_id', 'cliente_nombre_snapshot', 'cliente_doc_snapshot', 'vendedor_nombre_snapshot', 'empresa_nombre_snapshot', 'empresa_nit_snapshot', 'empresa_direccion_snapshot', 'empresa_telefono_snapshot', 'tipo_comprobante', 'metodo_pago'];
        console.log('\nFacturas:');
        for (const c of factCols) {
            console.log(`- ${c}: ${await checkCol('Facturas', c) ? 'OK' : 'MISSING'}`);
        }

        const detCols = ['id', 'factura_id', 'producto_id', 'cantidad', 'precio_unitario', 'subtotal', 'producto_nombre_snapshot'];
        console.log('\nDetalle_Facturas:');
        for (const c of detCols) {
            console.log(`- ${c}: ${await checkCol('Detalle_Facturas', c) ? 'OK' : 'MISSING'}`);
        }

        const movCols = ['id', 'productoId', 'usuarioId', 'tipo', 'cantidad', 'fecha', 'empresa_id', 'nro_lote', 'fecha_vto'];
        console.log('\nMovimientos:');
        for (const c of movCols) {
            console.log(`- ${c}: ${await checkCol('Movimientos', c) ? 'OK' : 'MISSING'}`);
        }

        console.log('\nConfiguración de Empresa (ID 1):');
        const emp = await pool.request().query("SELECT id, inv_stock_critico_global, inv_alertas_habilitadas FROM Empresa WHERE id = 1");
        console.log(JSON.stringify(emp.recordset[0], null, 2));

        console.log('\nConfigComprobantes para Empresa 1:');
        const conf = await pool.request().query("SELECT * FROM ConfigComprobantes WHERE empresa_id = 1");
        console.log(JSON.stringify(conf.recordset, null, 2));

        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}
debugBillingDeep();
