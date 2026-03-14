const { connectDB, sql } = require('./src/config/db');
const authService = require('./src/modules/auth/auth.service');
const factService = require('./src/modules/facturacion/facturacion.service');

async function debugFlow() {
    try {
        const pool = await connectDB();
        console.log("=== INICIANDO DEBUG SENIOR ===");

        // 1. Verificar un usuario Admin y su empresa actual
        const resAdmins = await pool.request().query("SELECT id, email, rol, empresa_id FROM Usuarios WHERE rol = 'admin'");
        const adminUser = resAdmins.recordset[0];
        console.log("[1] Admin Target:", adminUser);

        // 2. Verificar la Inserción de Factura (El bug reportado por el Admin)
        console.log("\n[2] Simulando Emisión de Factura con Admin id:", adminUser.id, " Empresa:", adminUser.empresa_id);
        const mockPayload = {
            cliente_id: 1, // Asumiendo que existe el cliente 1
            total: 100.50,
            detalles: [
                { producto_id: 1, cantidad: 1, precio_unitario: 100.50, subtotal: 100.50 }
            ]
        };

        try {
            const facturaId = await factService.createFactura(mockPayload, adminUser.id, adminUser.empresa_id);
            console.log("    -> Factura insertada correctamente ID:", facturaId);
        } catch (err) {
            console.error("    -> CRASH DETECTADO EN FACTURACION:", err.message);
        }

        // 3. Probar un login de Vendedor
        const resVend = await pool.request().query("SELECT id, email FROM Usuarios WHERE rol != 'admin'");
        if (resVend.recordset.length > 0) {
            console.log("\n[3] Probando Vendedor Target:", resVend.recordset[0].email);
            try {
                // Intentamos logear usando solo authService.login para ver si revienta
                const resLogin = await authService.login(resVend.recordset[0].email, 'password123'); // Password mock
                console.log("    -> Login Vendedor completado sin crash (Token/Requerimientos devueltos)");
            } catch (err) {
                console.log("    -> Rechazo de credenciales como esperado:", err.message);
            }
        } else {
            console.log("\n[3] No hay vendedores para testear.");
        }

        process.exit(0);
    } catch (e) {
        console.error("DEBUG FATAL ERROR:", e);
        process.exit(1);
    }
}

debugFlow();
