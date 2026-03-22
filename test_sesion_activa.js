const posService = require('./src/modules/pos/pos.service');

(async () => {
    try {
        console.log("Testeando posService.getSesionActiva...");
        // usuario 1, caja 2
        const res = await posService.getSesionActiva(2, 1);
        console.log("Exito:", res);
        process.exit(0);
    } catch(e) {
        console.error("Service Error:", e.message);
        process.exit(1);
    }
})();
