const { connectDB } = require('./src/config/db');

async function fixUniqueness() {
    try {
        const pool = await connectDB();
        console.log('--- ACTUALIZANDO RESTRICCIÓN DE UNICIDAD Facturas (Intento 2) ---');

        // Buscar cualquier constraint de tipo UNIQUE en la tabla Facturas
        const query = `
            DECLARE @sql NVARCHAR(MAX) = '';
            SELECT @sql += 'ALTER TABLE Facturas DROP CONSTRAINT ' + name + ';'
            FROM sys.key_constraints 
            WHERE parent_object_id = OBJECT_ID('Facturas') AND type = 'UQ';
            
            IF @sql <> ''
            BEGIN
                EXEC sp_executesql @sql;
                PRINT 'Constraints eliminados: ' + @sql;
            END
            ELSE
            BEGIN
                PRINT 'No se encontraron constraints UNIQUE para eliminar.';
            END

            -- Crear el nuevo constraint si no existe
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'UQ_Facturas_Empresa_Numero' AND type = 'UQ')
            BEGIN
                ALTER TABLE Facturas ADD CONSTRAINT UQ_Facturas_Empresa_Numero UNIQUE (empresa_id, nro_factura);
                PRINT 'Nuevo constraint UQ_Facturas_Empresa_Numero creado.';
            END
            ELSE
            BEGIN
                PRINT 'El nuevo constraint ya existía.';
            END
        `;

        const result = await pool.request().query(query);
        console.log('Resultado SQL:', result.rowsAffected);

        console.log('Operación finalizada.');
        process.exit(0);
    } catch (err) {
        console.error('ERROR DETALLADO:', err.message);
        if (err.precedingErrors) {
            err.precedingErrors.forEach((e, i) => console.error(`Error ${i}:`, e.message));
        }
        process.exit(1);
    }
}

fixUniqueness();
