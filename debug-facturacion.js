const { connectDB, sql } = require('./src/config/db');
const facturacionRepository = require('./src/repositories/facturacion.repository');

async function debug() {
    console.log('--- Iniciando Depuración de Facturación (Senior Audit) ---');
    let pool;
    try {
        pool = await connectDB();
        
        // 1. Obtener una empresa y un cliente válido
        const empresa = await pool.request().query("SELECT TOP 1 id FROM Empresa");
        if (!empresa.recordset[0]) throw new Error("No hay empresas en la base de datos");
        const eid = empresa.recordset[0].id;
        console.log(`[INFO] Usando Empresa ID: ${eid}`);

        const cliente = await pool.request().input('eid', sql.Int, eid).query("SELECT TOP 1 id FROM Clientes WHERE empresa_id = @eid");
        if (!cliente.recordset[0]) throw new Error("No hay clientes para esta empresa");
        const cid = cliente.recordset[0].id;
        console.log(`[INFO] Usando Cliente ID: ${cid}`);

        const producto = await pool.request().input('eid', sql.Int, eid).query("SELECT TOP 1 id, nombre, precio, stock FROM Productos WHERE empresa_id = @eid AND stock > 0");
        if (!producto.recordset[0]) throw new Error("No hay productos con stock para esta empresa");
        const prod = producto.recordset[0];
        console.log(`[INFO] Usando Producto ID: ${prod.id} (${prod.nombre}), Precio: ${prod.precio}, Stock: ${prod.stock}`);

        const usuario = await pool.request().input('eid', sql.Int, eid).query("SELECT TOP 1 id FROM Usuarios WHERE empresa_id = @eid");
        const uid = usuario.recordset[0] ? usuario.recordset[0].id : 1;

        // 2. Intentar crear factura
        const dummyFactura = {
            cliente_id: cid,
            total: prod.precio * 1,
            detalles: [
                {
                    producto_id: prod.id,
                    cantidad: 1,
                    precio_unitario: prod.precio,
                    subtotal: prod.precio
                }
            ],
            metodo_pago: 'Efectivo',
            tipo_comprobante: 'Factura'
        };

        console.log('[ACTION] Intentando FacturacionRepository.createFactura...');
        const resultId = await facturacionRepository.createFactura(pool, dummyFactura, uid, eid);
        console.log(`✅ EXITO: Factura creada con ID: ${resultId}`);

    } catch (err) {
        console.error('❌ ERROR DURANTE LA EMISIÓN:');
        console.error('Mensaje:', err.message);
        if (err.number) console.error('SQL Error Number:', err.number);
        if (err.procName) console.error('In Procedure:', err.procName);
        console.error('Stack:', err.stack);
    } finally {
        process.exit(0);
    }
}

debug();
