const sql = require('mssql');
require('dotenv').config({ path: '../.env' });

async function migrate() {
    try {
        console.log('--- Iniciando Migración Multi-Tenant (Phase 6) por SA ---');

        const config = {
            user: 'sa',
            password: 'Admin123!',
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT),
            options: { encrypt: false, trustServerCertificate: true }
        };
        const pool = await sql.connect(config);

        // 1. Empresa Default
        await pool.request().query(`
            IF NOT EXISTS (SELECT 1 FROM Empresa WHERE id = 1)
            BEGIN
                INSERT INTO Empresa (nombre, documento_identidad) 
                VALUES ('Mi Empresa Global', '000000000-0');
            END
        `);
        console.log('Empresa base asegurada.');

        const tables = ['Usuarios', 'Productos', 'Clientes', 'Facturas', 'Movimientos'];

        for (const table of tables) {
            // Verificar si la columna existe
            const checkCol = await pool.request().query(`
                SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '${table}' AND COLUMN_NAME = 'empresa_id'
            `);

            if (checkCol.recordset.length === 0) {
                console.log(`Migrando tabla ${table}...`);
                // 1. Agregar columna permitiendo NULLs
                await pool.request().query(`ALTER TABLE ${table} ADD empresa_id INT`);

                // 2. Actualizar registros existentes a la Empresa 1
                await pool.request().query(`UPDATE ${table} SET empresa_id = 1`);

                // 3. Modificar columna a NOT NULL
                await pool.request().query(`ALTER TABLE ${table} ALTER COLUMN empresa_id INT NOT NULL`);

                // 4. Agregar llave foránea
                await pool.request().query(`
                    ALTER TABLE ${table} 
                    ADD CONSTRAINT FK_${table}_Empresa 
                    FOREIGN KEY (empresa_id) REFERENCES Empresa(id)
                `);

                console.log(`Tabla ${table} migrada correctamente.`);
            } else {
                console.log(`Tabla ${table} ya contiene empresa_id.`);
            }
        }

        console.log('--- Migración Completada Exitosamente ---');
        process.exit(0);
    } catch (err) {
        console.error('--- ERROR DURANTE LA MIGRACIÓN ---');
        console.error(err);
        process.exit(1);
    }
}

migrate();
