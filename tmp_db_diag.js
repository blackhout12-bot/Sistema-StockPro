
const { connectDB, sql } = require('./src/config/db');

async function test() {
    try {
        console.log('Intentando conectar a la base de datos...');
        const pool = await connectDB();
        console.log('¡Conexión exitosa!');

        const constraints = await pool.request().query(`
            SELECT 
                tc.TABLE_NAME, 
                tc.CONSTRAINT_NAME, 
                kcu.COLUMN_NAME
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
            JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
            WHERE tc.CONSTRAINT_TYPE = 'UNIQUE'
        `);

        const fs = require('fs');
        let output = '--- TODAS LAS RESTRICCIONES UNIQUE ---\n';
        constraints.recordset.forEach(c => {
            output += `${c.TABLE_NAME}.${c.COLUMN_NAME} -> ${c.CONSTRAINT_NAME}\n`;
        });
        fs.writeFileSync('unique_constraints.txt', output);

        console.log('Diagnóstico escrito en unique_constraints.txt');
        process.exit(0);
    } catch (err) {
        console.error('Error en diagnóstico:', err);
        process.exit(1);
    }
}

test();
