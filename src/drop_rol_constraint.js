const { connectDB } = require('./config/db');

async function dropConstraint() {
    const pool = await connectDB();
    try {
        console.log('Finding constraint name...');
        const res = await pool.request().query("SELECT name FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('Usuarios') AND name LIKE 'CK__Usuarios__rol%'");
        if (res.recordset.length === 0) {
            console.log('No constraint found matching pattern.');
            return;
        }

        const name = res.recordset[0].name;
        console.log(`Dropping constraint: ${name}`);
        await pool.request().query(`ALTER TABLE Usuarios DROP CONSTRAINT [${name}]`);
        console.log('Constraint dropped successfully.');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
}

dropConstraint();
