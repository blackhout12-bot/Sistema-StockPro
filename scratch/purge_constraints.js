const { connectDB, sql } = require('../src/config/db');

async function run() {
    try {
        const pool = await connectDB();
        console.log('--- Purificando Columna empresa_id en Usuarios ---');
        
        await pool.request().query(`
            DECLARE @ConstraintName nvarchar(max);
            
            -- Buscar FKs
            SELECT @ConstraintName = name
            FROM sys.foreign_keys
            WHERE parent_object_id = OBJECT_ID('Usuarios')
            AND name LIKE '%Empresa%'; -- Busqueda por patrón
            
            IF @ConstraintName IS NOT NULL
            BEGIN
                EXEC('ALTER TABLE Usuarios DROP CONSTRAINT ' + @ConstraintName);
                PRINT 'Dropped FK: ' + @ConstraintName;
            END

            -- Buscar Default Constraints
            SELECT @ConstraintName = name
            FROM sys.default_constraints
            WHERE parent_object_id = OBJECT_ID('Usuarios')
            AND parent_column_id = COLUMNPROPERTY(OBJECT_ID('Usuarios'), 'empresa_id', 'ColumnId');

            IF @ConstraintName IS NOT NULL
            BEGIN
                EXEC('ALTER TABLE Usuarios DROP CONSTRAINT ' + @ConstraintName);
                PRINT 'Dropped Default: ' + @ConstraintName;
            END

            -- Alterar columna
            ALTER TABLE Usuarios ALTER COLUMN empresa_id INT NULL;
            PRINT 'Columna alterada a NULLABLE';

            -- Recrear FK (nombre estándar)
            IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Usuario_Empresa')
            BEGIN
                ALTER TABLE Usuarios ADD CONSTRAINT FK_Usuario_Empresa 
                FOREIGN KEY (empresa_id) REFERENCES Empresa(id);
                PRINT 'FK Recreada';
            END
        `);
        
        console.log('OK');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error en migración:', err);
        process.exit(1);
    }
}

run();
