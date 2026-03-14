const { connectDB, sql } = require('./config/db');

async function createEmpresaTable() {
    try {
        const pool = await connectDB();
        const request = pool.request();

        const query = `
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Empresa' AND xtype='U')
            BEGIN
                CREATE TABLE Empresa (
                    id INT PRIMARY KEY IDENTITY(1,1),
                    nombre NVARCHAR(100) NOT NULL,
                    documento_identidad NVARCHAR(50),
                    direccion NVARCHAR(255),
                    telefono NVARCHAR(50),
                    email NVARCHAR(100),
                    fecha_creacion DATETIME DEFAULT GETDATE()
                )
            END
        `;

        await request.query(query);
        console.log('✅ Tabla Empresa verificada/creada');
    } catch (error) {
        console.error('❌ Error al crear la tabla Empresa:', error.message);
    }
}

if (require.main === module) {
    createEmpresaTable().then(() => process.exit());
}

module.exports = createEmpresaTable;
