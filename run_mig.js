require('dotenv').config();
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        instanceName: process.env.DB_INSTANCE || undefined
    }
};

async function runMigration() {
    try {
        console.log('⏳ Conectando a la base de datos...');
        const pool = await sql.connect(dbConfig);
        console.log('✅ Conexión establecida.');

        const migrationFile = process.argv[2] || 'src/migrations/004_rbac.sql';
        const sqlFilePath = path.isAbsolute(migrationFile) ? migrationFile : path.join(__dirname, migrationFile);

        if (!fs.existsSync(sqlFilePath)) {
            console.error(`❌ El archivo no existe: ${sqlFilePath}`);
            process.exit(1);
        }

        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        // Split by GO since mssql doesn't support GO natively in a single query block
        const batches = sqlContent.split(/^GO\s*$/m).filter(b => b.trim().length > 0);

        console.log(`🚀 Ejecutando migración en ${batches.length} lotes...`);
        for (let i = 0; i < batches.length; i++) {
            try {
                await pool.request().query(batches[i]);
                console.log(`Lote ${i + 1}/${batches.length} completado.`);
            } catch (e) {
                console.error(`\n❌ Error en el lote ${i + 1}:\n${batches[i]}\n>>> ${e.message}`);
                process.exit(1);
            }
        }

        console.log(`🎉 Migración ${path.basename(sqlFilePath)} ejecutada correctamente.`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error de conexion:', err.message);
        process.exit(1);
    }
}

runMigration();
