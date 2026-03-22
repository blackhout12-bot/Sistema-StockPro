const productosService = require('./src/modules/productos/productos.service');

(async () => {
    try {
        console.log("Testeando productosService.listarProductosPaginados...");
        const res = await productosService.listarProductosPaginados({
            empresa_id: 1,
            page: 1,
            limit: 20,
            search: '',
            categoria: ''
        });
        console.log("Exito:", res);
        process.exit(0);
    } catch(e) {
        console.error("Service Error:", e.message);
        process.exit(1);
    }
})();
