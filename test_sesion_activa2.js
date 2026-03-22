const posService = require('./src/modules/pos/pos.service');

(async () => {
    try {
        console.log("Testeando getSesionActiva SIN caja_id...");
        // caja_id null, usuario 1
        const res = await posService.getSesionActiva(null, 1);
        console.log("Exito:", res);
        process.exit(0);
    } catch(e) {
        console.error("Service Error:", e.message);
        process.exit(1);
    }
})();
