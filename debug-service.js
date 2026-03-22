const factService = require('./src/modules/facturacion/facturacion.service');
const { connectDB } = require('./src/config/db');

async function debug() {
    console.log('--- START ---');
    try {
        const pool = await connectDB();
        const empresa_id = 1;
        const usuario_id = 1;

        const cliRes = await pool.request().input('eid', empresa_id).query('SELECT TOP 1 id FROM Clientes WHERE empresa_id = @eid');
        const cliente_id = cliRes.recordset[0].id;

        const prodRes = await pool.request().input('eid', empresa_id).query('SELECT TOP 1 id, precio, nombre FROM Productos WHERE empresa_id = @eid AND stock > 0');
        const producto = prodRes.recordset[0];

        const payload = {
            cliente_id,
            total: producto.precio,
            detalles: [
                {
                    producto_id: producto.id,
                    cantidad: 1,
                    precio_unitario: producto.precio,
                    subtotal: producto.precio,
                    deposito_id: 1 
                }
            ],
            tipo_comprobante: 'Factura B',
            origen_venta: 'Local',
            moneda: 'ARS', // wait is it moneda_id or moneda in invoice payload?
            tasa_cambio: 1.0,
            sucursal_id: 1 // Test injection
        };

        const res = await factService.createFactura(payload, usuario_id, empresa_id);
        console.log('SUCCESS:', res.id);
    } catch (e) {
        console.error('ERROR!');
        console.error(e);
    }
    process.exit(0);
}

debug();
