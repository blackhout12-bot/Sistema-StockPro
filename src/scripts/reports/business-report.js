const { connectDB } = require('../../config/db');
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

async function generateBusinessReport() {
    console.log('📊 Generando Reporte Comercial de Release (StockPro ERP)...');
    
    try {
        const pool = await connectDB();
        
        // 1. Snapshot del Valor Monetario del Inventario
        const stockValorizadoRes = await pool.request().query(`
            SELECT ISNULL(SUM(stock * precio), 0) as total_valorizado, COUNT(*) as variantes_activas
            FROM Productos
        `);
        const { total_valorizado, variantes_activas } = stockValorizadoRes.recordset[0];

        // 2. Top 5 Productos con riesgo de Quiebre (Agotamiento)
        const agotamientoRes = await pool.request().query(`
            SELECT TOP 5 nombre, stock, ISNULL(JSON_VALUE(custom_fields, '$.Talle'), 'N/A') as talle 
            FROM Productos 
            ORDER BY stock ASC
        `);
        const agotadosHTML = agotamientoRes.recordset.map(r => `<tr><td>${r.nombre}</td><td>${r.talle}</td><td>${r.stock}</td></tr>`).join('');

        // 3. Riesgos de Vencimiento de Lotes (SRE Health)
        const vencimientoRes = await pool.request().query(`
            SELECT COUNT(*) as lotes_criticos
            FROM Lotes
            WHERE fecha_vto <= DATEADD(day, 15, GETDATE())
        `);
        const { lotes_criticos } = vencimientoRes.recordset[0];

        const markdownTemplate = `
# 📉 Reporte Comercial - Release StockPro

**Fecha de Extracción:** ${new Date().toISOString()}

## 💰 1. Patrimonio Activo
- **Capital Inmovilizado en Inventario:** $${total_valorizado.toLocaleString()} ARS
- **Variantes de Producto Totales:** ${variantes_activas}

## 🚨 2. Alertas de Quiebre Algorítmico (Top 5)
Productos que la IA predictiva demanda reabastecer inminentemente:

<table>
    <tr><th>Producto</th><th>Atributo Custom</th><th>Stock Restante</th></tr>
    ${agotadosHTML}
</table>

## ⏳ 3. SRE & Riesgo Sanitario
- **Lotes Críticos (< 15 días exp):** ${lotes_criticos} lotes. Generar Promociones.

_Generado automáticamente mediante el pipeline de CLI de StockPro._
        `;

        const outPath = path.join(__dirname, '../../../../release_business_report.md');
        fs.writeFileSync(outPath, markdownTemplate.trim());
        
        console.log(`✅ Reporte Comercial emitido en: ${outPath}`);
        process.exit(0);

    } catch (err) {
        console.error('❌ Error generando Business Report:', err);
        process.exit(1);
    }
}

generateBusinessReport();
