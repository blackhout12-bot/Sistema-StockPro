const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function seed() {
    console.log('🌱 Iniciando DB Seeder para StockPro...');
    let pool;
    try {
        pool = await sql.connect(dbConfig);
        console.log('✅ Conexión establecida con la Base de Datos.');

        // 1. Sembrar Categorías Base
        console.log('📦 Sembrando Categorías Base...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Categorias' and xtype='U')
            BEGIN
                CREATE TABLE Categorias (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    nombre NVARCHAR(100) NOT NULL UNIQUE
                )
            END

            IF NOT EXISTS (SELECT * FROM Categorias WHERE nombre = 'Electrónica')
                INSERT INTO Categorias (nombre) VALUES ('Electrónica'), ('Hogar'), ('Indumentaria'), ('Servicios')
        `);

        // 2. Sembrar Comprobantes AFIP Genéricos
        console.log('🧾 Sembrando Comprobantes AFIP...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Comprobantes' and xtype='U')
            BEGIN
                CREATE TABLE Comprobantes (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    tipo_comprobante NVARCHAR(50) NOT NULL UNIQUE,
                    activo BIT DEFAULT 1
                )
            END

            IF NOT EXISTS (SELECT * FROM Comprobantes WHERE tipo_comprobante = 'Factura A')
                INSERT INTO Comprobantes (tipo_comprobante, activo) VALUES 
                ('Factura A', 1), ('Factura B', 1), ('Factura C', 1), ('Ticket', 1), ('Presupuesto', 1)
        `);

        // 3. Sembrar Productos Demo
        console.log('🛒 Sembrando Productos Demo (Inventario Base)...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Productos' and xtype='U')
            BEGIN
                CREATE TABLE Productos (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    nombre NVARCHAR(150) NOT NULL,
                    descripcion NVARCHAR(255),
                    precio DECIMAL(10,2) NOT NULL,
                    stock_actual INT DEFAULT 0,
                    categoria_id INT NULL,
                    sku NVARCHAR(100) NULL,
                    creado_en DATETIME DEFAULT GETDATE()
                )
            END

            IF NOT EXISTS (SELECT * FROM Productos WHERE nombre LIKE '%Demo%')
            BEGIN
                INSERT INTO Productos (nombre, descripcion, precio, stock_actual, sku)
                VALUES 
                ('Monitor UltraWide 34 Demo', 'Monitor Gamer Curvo 144Hz', 350000.00, 15, 'MON-01-DEMO'),
                ('Teclado Mecánico RGB Demo', 'Switch Red 60%', 85000.00, 30, 'TEC-01-DEMO'),
                ('Silla Ergonómica Pro Demo', 'Soporte lumbar ajustable', 120000.00, 10, 'SIL-01-DEMO')
            END
        `);

        console.log('🚀 Seeders ejecutados correctamente. La base de datos está lista.');
    } catch (err) {
        console.error('❌ Error ejecutando seeders:', err);
    } finally {
        if (pool) {
            await pool.close();
            console.log('🔒 Conexión a la Base de Datos cerrada.');
        }
    }
}

seed();
