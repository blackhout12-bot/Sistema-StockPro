const productosService = require('./src/modules/productos/productos.service');

(async () => {
    try {
        console.log("Testeando productosService.agregarProducto...");
        // agregarProducto(nombre, descripcion, precio, stock, categoria, empresa_id, sku, moneda_id, custom_fields)
        const res = await productosService.agregarProducto(
            'Test Service',
            'Un test',
            1000,
            10,
            'General',
            1,
            'TEST-002',
            'ARS',
            { test_field: 'works' }
        );
        console.log("Exito:", res);
        process.exit(0);
    } catch(e) {
        console.error("Service Error:", e.message);
        process.exit(1);
    }
})();
