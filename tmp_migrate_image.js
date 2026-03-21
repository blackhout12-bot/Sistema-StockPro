const { connectDB } = require('./src/config/db');

async function run() {
    const pool = await connectDB();
    try {
        console.log('Adding image_url column to Productos table...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Productos]') AND name = 'image_url')
            BEGIN
                ALTER TABLE [dbo].[Productos] ADD image_url NVARCHAR(255) NULL;
                PRINT 'Column image_url added successfully.';
            END
            ELSE
            BEGIN
                PRINT 'Column image_url already exists.';
            END
        `);
    } catch (e) {
        console.error('Error during migration:', e);
    }
    process.exit(0);
}

run();
