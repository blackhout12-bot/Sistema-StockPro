const { connectDB, sql } = require('./src/config/db');

async function fixAuditoria() {
    try {
        const pool = await connectDB();
        console.log('Conectado a StockDB...');

        // 1. Encontrar y borrar constraints de empresa_id
        await pool.request().query(`
            DECLARE @ConstraintName nvarchar(200)
            SELECT @ConstraintName = Name FROM sys.default_constraints
            WHERE parent_object_id = object_id('dbo.Auditoria')
            AND parent_column_id = (SELECT column_id FROM sys.columns
                                    WHERE name = 'empresa_id'
                                    AND object_id = object_id('dbo.Auditoria'))
            IF @ConstraintName IS NOT NULL
            BEGIN
                EXEC('ALTER TABLE dbo.Auditoria DROP CONSTRAINT ' + @ConstraintName)
                PRINT 'Constraint eliminada.'
            END

            -- 2. Alterar columna a NULL
            ALTER TABLE dbo.Auditoria ALTER COLUMN empresa_id INT NULL;
            PRINT 'Columna empresa_id alterada a NULL.';
        `);

        console.log('Corrección de Auditoria completada.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

fixAuditoria();
