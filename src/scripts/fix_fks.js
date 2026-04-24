const { connectDB } = require('../config/db');

async function fixDB() {
    const pool = await connectDB();
    try {
        await pool.request().query(`
            -- Cascada Usuarios -> Sucursales
            ALTER TABLE dbo.Usuarios DROP CONSTRAINT IF EXISTS FK_Usuario_Sucursal;
            ALTER TABLE dbo.Usuarios ADD CONSTRAINT FK_Usuario_Sucursal FOREIGN KEY (sucursal_id) REFERENCES dbo.Sucursales(id);

            -- Cascada Depositos -> Sucursales
            ALTER TABLE dbo.Depositos DROP CONSTRAINT IF EXISTS FK_Deposito_Sucursal;
            ALTER TABLE dbo.Depositos ADD CONSTRAINT FK_Deposito_Sucursal FOREIGN KEY (sucursal_id) REFERENCES dbo.Sucursales(id) ON DELETE CASCADE;
            
            -- Aseguramos nuevamente que las columnas acepten null en nuestro entorno (por si se revirtió)
            DROP SECURITY POLICY IF EXISTS dbo.policy_Usuarios;
            DROP FUNCTION IF EXISTS dbo.fn_securitypredicate_Usuarios;
            ALTER TABLE dbo.Usuarios ALTER COLUMN empresa_id INT NULL;
            ALTER TABLE dbo.UsuarioEmpresas ALTER COLUMN empresa_id INT NULL;
        `);
        console.log("Integridad referencial y nulidad ajustada con éxito.");
    } catch (e) {
        console.error("Error al ajustar base de datos:", e);
    } finally {
        process.exit(0);
    }
}
fixDB();
