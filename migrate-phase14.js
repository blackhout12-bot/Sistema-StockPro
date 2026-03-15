const { connectDB, sql } = require('./src/config/db');

async function runMigration() {
    try {
        const pool = await connectDB();

        // 1. OLAP Log Table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OLAPLog' AND xtype='U')
            BEGIN
                CREATE TABLE OLAPLog (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    usuario_id INT NOT NULL,
                    consulta NVARCHAR(MAX) NOT NULL,
                    fecha DATETIME DEFAULT GETDATE(),
                    tiempo_ejecucion_ms INT NOT NULL
                );
                PRINT 'Table OLAPLog created.';
            END
        `);

        // 2. Multi-currency Support in Facturas
        await pool.request().query(`
            IF COL_LENGTH('Facturas', 'moneda') IS NULL
            BEGIN
                ALTER TABLE Facturas ADD moneda NVARCHAR(10) DEFAULT 'ARS' NOT NULL;
                PRINT 'Column moneda added to Facturas.';
            END

            IF COL_LENGTH('Facturas', 'tasa_cambio') IS NULL
            BEGIN
                ALTER TABLE Facturas ADD tasa_cambio DECIMAL(18,4) DEFAULT 1.0 NOT NULL;
                PRINT 'Column tasa_cambio added to Facturas.';
            END
        `);

        // 3. Multi-currency Support in Movimientos
        await pool.request().query(`
            IF COL_LENGTH('Movimientos', 'moneda') IS NULL
            BEGIN
                ALTER TABLE Movimientos ADD moneda NVARCHAR(10) DEFAULT 'ARS' NOT NULL;
                PRINT 'Column moneda added to Movimientos.';
            END

            IF COL_LENGTH('Movimientos', 'tasa_cambio') IS NULL
            BEGIN
                ALTER TABLE Movimientos ADD tasa_cambio DECIMAL(18,4) DEFAULT 1.0 NOT NULL;
                PRINT 'Column tasa_cambio added to Movimientos.';
            END
        `);

        // 4. Currency Audit Log Table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AuditoriaMoneda' AND xtype='U')
            BEGIN
                CREATE TABLE AuditoriaMoneda (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    entidad_tipo NVARCHAR(50) NOT NULL, -- 'Factura' o 'Movimiento'
                    entidad_id INT NOT NULL,
                    moneda_origen NVARCHAR(10) NOT NULL,
                    moneda_destino NVARCHAR(10) NOT NULL,
                    tasa_aplicada DECIMAL(18,4) NOT NULL,
                    fecha DATETIME DEFAULT GETDATE()
                );
                PRINT 'Table AuditoriaMoneda created.';
            END
        `);

        // 5. OLAP Views (Cubo de Ventas Simulado)
        await pool.request().query(`
            IF OBJECT_ID('vw_CuboVentas', 'V') IS NOT NULL
                DROP VIEW vw_CuboVentas;
        `);
        await pool.request().query(`
            CREATE VIEW vw_CuboVentas AS
            SELECT 
                f.empresa_id,
                YEAR(f.fecha_emision) AS anio,
                MONTH(f.fecha_emision) AS mes,
                DAY(f.fecha_emision) AS dia,
                f.estado,
                f.moneda,
                SUM(f.total) AS total_ventas_brutas,
                SUM(f.total * f.tasa_cambio) AS total_ventas_ars_base,
                COUNT(f.id) AS cantidad_facturas
            FROM Facturas f
            GROUP BY 
                f.empresa_id,
                YEAR(f.fecha_emision),
                MONTH(f.fecha_emision),
                DAY(f.fecha_emision),
                f.estado,
                f.moneda;
        `);
        console.log('Created OLAP View: vw_CuboVentas.');

        console.log('BI/OLAP/Multi-currency Migration successful');
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

runMigration();
