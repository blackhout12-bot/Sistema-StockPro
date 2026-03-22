const posService = require('./src/modules/pos/pos.service');

(async () => {
    try {
        console.log("Testeando posService.abrirSesion...");
        const res = await posService.abrirSesion(2, 1, 5000);
        console.log("Exito:", res);
        process.exit(0);
    } catch(e) {
        console.error("Service Error:", e.message);
        process.exit(1);
    }
})();
