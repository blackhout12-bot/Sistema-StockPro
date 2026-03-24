const { connectDB } = require('./src/config/db');

async function migrateCategorias() {
    let pool;
    try {
        pool = await connectDB();
        
        console.log("Creating new Categorias table...");
        await pool.request().query(`
            CREATE TABLE Categorias (
                id INT IDENTITY(1,1) PRIMARY KEY,
                nombre NVARCHAR(150) NOT NULL,
                descripcion NVARCHAR(MAX) NULL,
                empresa_id INT NOT NULL,
                sucursal_id INT NULL,
                deposito_id INT NULL,
                activo BIT DEFAULT 1,
                creado_en DATETIME2 DEFAULT GETDATE(),
                actualizado_en DATETIME2 DEFAULT GETDATE(),
                
                CONSTRAINT FK_Categorias_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id),
                CONSTRAINT FK_Categorias_Sucursales FOREIGN KEY (sucursal_id) REFERENCES Sucursales(id),
                CONSTRAINT FK_Categorias_Depositos FOREIGN KEY (deposito_id) REFERENCES Depositos(id)
            );
        `);

        console.log("Adding categoria_id to Productos...");
        const columns = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Productos' AND COLUMN_NAME = 'categoria_id'
        `);
        
        if (columns.recordset.length === 0) {
            await pool.request().query(`
                ALTER TABLE Productos 
                ADD categoria_id INT NULL 
                CONSTRAINT FK_Productos_Categorias FOREIGN KEY REFERENCES Categorias(id);
            `);
            console.log("categoria_id added to Productos.");
        } else {
            console.log("categoria_id already exists in Productos.");
        }

        console.log("Migration completed successfully.");
        process.exit(0);
    } catch(err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrateCategorias();
