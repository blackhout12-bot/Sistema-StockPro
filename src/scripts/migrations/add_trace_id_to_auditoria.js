const { connectDB } = require('../../config/db');
const logger = require('../../utils/logger');

async function migrate() {
    try {
        const pool = await connectDB();
        logger.info('Agregando columna trace_id a dbo.Auditoria...');
        
        await pool.request().query(`
            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID(N'[dbo].[Auditoria]') 
                AND name = 'trace_id'
            )
            BEGIN
                ALTER TABLE dbo.Auditoria ADD trace_id VARCHAR(50) NULL;
                PRINT 'Columna trace_id agregada exitosamente.';
            END
            ELSE
            BEGIN
                PRINT 'La columna trace_id ya existe.';
            END
        `);
        
        logger.info('Migración completada exitosamente.');
    } catch (err) {
        logger.error({ err }, 'Error durante la migración de Auditoria');
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

migrate();
