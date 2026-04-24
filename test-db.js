const { connectDB } = require('./src/config/db');

async function run() {
    const pool = await connectDB();
    try {
        await pool.request().query(`
            DROP SECURITY POLICY IF EXISTS dbo.policy_Usuarios;
            DROP FUNCTION IF EXISTS dbo.fn_securitypredicate_Usuarios;
            ALTER TABLE dbo.Usuarios ALTER COLUMN empresa_id int NULL;
            ALTER TABLE dbo.UsuarioEmpresas ALTER COLUMN empresa_id int NULL;
        `);
        console.log("Exito alterando columnas a NULL");
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
