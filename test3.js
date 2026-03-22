const { connectDB } = require('./src/config/db');
const factRepos = require('./src/modules/facturacion/facturacion.repository');

async function debugFactura() {
    try {
        console.log('Connecting DB...');
        const pool = await connectDB();
        
        console.log('Fetching test user/empresa...');
        const userRes = await pool.request().query('SELECT TOP 1 id, empresa_id FROM Usuarios WHERE empresa_id IS NOT NULL');
        
        if (userRes.recordset.length === 0) {
            console.error('No users found.');
            process.exit(1);
        }
        
        const { id: usuario_id, empresa_id } = userRes.recordset[0];
        
        console.log('Fetching test client...');
        const cliRes = await pool.request()
            .input('eid', empresa_id)
            .query('SELECT TOP 1 id FROM Clientes WHERE empresa_id = @eid');
        
        if (cliRes.recordset.length === 0) {
            console.error('No clients found for this company.');
            process.exit(1);
        }
        const cliente_id = cliRes.recordset[0].id;
        
        console.log('Fetching test product with stock...');
        const prodRes = await pool.request()
            .input('eid', empresa_id)
            .query('SELECT TOP 1 id, precio FROM Productos WHERE empresa_id = @eid AND stock > 0');
            
        if (prodRes.recordset.length === 0) {
            console.error('No products with stock found.');
            process.exit(1);
        }
        
        const producto = prodRes.recordset[0];
        
        console.log(`User: ${usuario_id}, Empresa: ${empresa_id}, Cliente: ${cliente_id}, Producto: ${producto.id}`);
        
        const payload = {
            cliente_id,
            total: producto.precio,
            detalles: [
                {
                    producto_id: producto.id,
                    cantidad: 1,
                    precio_unitario: producto.precio,
                    subtotal: producto.precio,
                    // deposito_id will be auto-resolved by repository to principal
                }
            ],
            tipo_comprobante: 'Factura B'
        };
        
        console.log('Calling createFactura...');
        const factura_id = await factRepos.createFactura(pool, payload, usuario_id, empresa_id);
        
        console.log('SUCCESS! invoice generated with ID:', factura_id);
    } catch (e) {
        console.error('ERROR TRACE:');
        console.error(e);
    }
    
    process.exit(0);
}

debugFactura();
