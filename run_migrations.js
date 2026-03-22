const fs = require('fs');
const path = require('path');
const { connectDB } = require('./src/config/db');

(async () => {
    try {
        const pool = await connectDB();
        const migrations = [
            'src/migrations/018_categorias_esquema.sql',
            'src/migrations/019_pos_cajas_sesiones.sql'
        ];

        for (const file of migrations) {
            const sqlPath = path.join(__dirname, file);
            if (fs.existsSync(sqlPath)) {
                let sqlQuery = fs.readFileSync(sqlPath, 'utf8');
                console.log(`Ejecutando ${file}...`);
                // Split GO statements because mssql driver doesn't support GO
                const batches = sqlQuery.split(/^GO\s*$/im);
                for (let batch of batches) {
                    batch = batch.trim();
                    if (batch) {
                        try {
                            await pool.request().query(batch);
                        } catch(err) {
                            console.error(`Error en bloque de ${file}:`, err.message);
                        }
                    }
                }
                console.log(`OK: ${file}`);
            } else {
                console.log(`No encontrado: ${file}`);
            }
        }
        process.exit(0);
    } catch(e) {
        console.error("Fatal Error:", e.message);
        process.exit(1);
    }
})();
