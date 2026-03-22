const productosService = require('./src/modules/productos/productos.service');

(async () => {
    try {
        console.log("Testeando productosService.getCategoriasEsquemas...");
        const res = await productosService.getCategoriasEsquemas(1);
        console.log("Exito:", res);
        process.exit(0);
    } catch(e) {
        console.error("Service Error:", e.message);
        process.exit(1);
    }
})();
