const { connectDB } = require('./src/config/db');

async function fixUniqueness() {
    try {
        const pool = await connectDB();
        console.log('--- ACTUALIZANDO RESTRICCIÓN DE UNICIDAD Facturas ---');

        // 1. Encontrar el nombre real del constraint (ya lo vimos: UQ__Facturas__B31FA9AE022744DF)
        const constraintRes = await pool.request().query("SELECT name FROM sys.objects WHERE type = 'UQ' AND parent_object_id = OBJECT_ID('Facturas') AND name LIKE 'UQ__Facturas%'");

        if (constraintRes.recordset.length > 0) {
            const constraintName = constraintRes.recordset[0].name;
            console.log(`Eliminando constraint antiguo: ${constraintName}`);
            await pool.request().query(`ALTER TABLE Facturas DROP CONSTRAINT ${constraintName}`);
        }

        // 2. Crear el nuevo constraint compuesto por empresa_id y nro_factura
        console.log('Creando nuevo constraint UNIQUE(empresa_id, nro_factura)...');
        // Usamos un bloque TRY para evitar fallos si el constraint ya existe (aunque acabamos de borrar los que digan UQ__Facturas)
        try {
            await pool.request().query("ALTER TABLE Facturas ADD CONSTRAINT UQ_Facturas_Empresa_Numero UNIQUE (empresa_id, nro_factura)");
            console.log('Constraint actualizado correctamente.');
        } catch (e) {
            if (e.message.includes('already exists')) {
                console.log('El constraint ya existe.');
            } else {
                throw e;
            }
        }

        console.log('Operación finalizada.');
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}

fixUniqueness();
