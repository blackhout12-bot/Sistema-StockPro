const { connectDB } = require('./src/config/db');
const factRepos = require('./src/modules/facturacion/facturacion.repository');

async function debugFactura() {
    console.log('--- STARTING REPOSITORY-LEVEL DIAGNOSTIC ---');
    try {
        const pool = await connectDB();
        
        // Asumiendo DB ya poblada (por ej. admin@sistema.com)
        const empresa_id = 1;
        const usuario_id = 1;

        console.log('Fetching test tools for company:', empresa_id);
        
        const cliRes = await pool.request().input('eid', empresa_id).query('SELECT TOP 1 id FROM Clientes WHERE empresa_id = @eid');
        if (cliRes.recordset.length === 0) throw new Error('No clients found for this company.');
        const cliente_id = cliRes.recordset[0].id;

        const prodRes = await pool.request().input('eid', empresa_id).query('SELECT TOP 1 id, precio, nombre FROM Productos WHERE empresa_id = @eid AND stock > 0');
        if (prodRes.recordset.length === 0) throw new Error('No products with stock found.');
        const producto = prodRes.recordset[0];
        console.log('Testing with product:', producto.nombre, typeof producto.id);

        const payload = {
            cliente_id,
            total: producto.precio,
            detalles: [
                {
                    producto_id: producto.id,
                    cantidad: 1,
                    precio_unitario: producto.precio,
                    subtotal: producto.precio,
                    deposito_id: 1 // Test value
                }
            ],
            tipo_comprobante: 'Factura B',
            origen_venta: 'Local',
            sucursal_id: 1
        };

        console.log('Calling createFactura repository function...');
        const result = await factRepos.createFactura(pool, payload, usuario_id, empresa_id);
        console.log('SUCCESS! invoice generated with ID:', result);
    } catch (e) {
        console.error('CRITICAL REPOSITORY ERROR:');
        console.error(e);
    }
    process.exit(0);
}

debugFactura();
