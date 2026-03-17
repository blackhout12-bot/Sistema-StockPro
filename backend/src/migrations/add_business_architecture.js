require('dotenv').config({ path: '../.env' });
const sql = require('mssql');

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function migrate_business_architecture() {
    console.log('🔄 Iniciando migración de DB (Arquitectura de Negocio)...');
    try {
        let pool = await sql.connect(dbConfig);
        
        console.log('1️⃣ Inyectando Feature Toggles en tabla Empresa');
        await pool.request().query(`
            IF COL_LENGTH('Empresa', 'feature_toggles') IS NULL
            BEGIN
                ALTER TABLE Empresa ADD feature_toggles NVARCHAR(MAX) DEFAULT '{}';
                PRINT 'Columna feature_toggles agregada a Empresa.';
            END ELSE BEGIN
                PRINT 'La columna feature_toggles ya existe en Empresa.';
            END
        `);

        console.log('2️⃣ Inyectando Custom Fields (JSON) en tabla Productos');
        await pool.request().query(`
            IF COL_LENGTH('Productos', 'custom_fields') IS NULL
            BEGIN
                ALTER TABLE Productos ADD custom_fields NVARCHAR(MAX) DEFAULT '{}';
                PRINT 'Columna custom_fields agregada a Productos.';
            END ELSE BEGIN
                PRINT 'La columna custom_fields ya existe en Productos.';
            END
        `);

        console.log('✅ Migración estructural completada exitosamente.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error fatal en migración:', err);
        process.exit(1);
    }
}

migrate_business_architecture();
