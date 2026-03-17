const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function generateTechnicalReport() {
    console.log('⚙️ Generando Reporte Técnico de Release (StockPro ERP)...');

    try {
        // Ejecutar los comandos dry-run para evitar bloqueos
        let lintOutput = '';
        try {
            console.log('   - Analizando eslint errors...');
            lintOutput = execSync('npm run lint --if-present', { cwd: path.join(__dirname, '../../../frontend'), encoding: 'utf-8' });
        } catch (e) {
            lintOutput = e.stdout || 'Errores detectados en Linter (Fase 1 completada con Warnings).';
        }

        let dockerStatus = '';
        try {
             console.log('   - Verificando estado Observabilidad...');
             dockerStatus = execSync('docker ps --format "{{.Names}} - {{.Status}}"', { encoding: 'utf-8' });
        } catch(e) {
             dockerStatus = '⚠️ Docker inactivo.';
        }

        const markdownTemplate = `
# 🛠️ Reporte Técnico y de Resiliencia - Release StockPro

**Fecha de Integración Continua (CI):** ${new Date().toISOString()}

## 1. Topología de Contenedores (Observabilidad)
El clúster de nodos paralelos arroja este fingerprint local:
\`\`\`text
${dockerStatus.trim()}
\`\`\`

## 2. DX & Code Quality (ESLint)
Extracción de advertencias de deuda técnica remanentes en frontend:
\`\`\`text
${lintOutput.split('\\n').slice(0, 5).join('\\n')}
...(Trunk parcial para lectura rápida)...
\`\`\`

## 3. Estado de IA (Inteligencia Predictiva)
- **Motor ML Core**: \`simple-statistics\` instalado nativamente 
- **Modelo Actual**: Regresión Lineal de Mínimos Cuadrados
- **Dataset Cronológico**: Extrae 60 días continuos \`DATEADD(day, -60, GETDATE())\`

_Sello de Release Tech (Automated Script)._
        `;

        const outPath = path.join(__dirname, '../../../../release_technical_report.md');
        fs.writeFileSync(outPath, markdownTemplate.trim());
        
        console.log(`✅ Reporte Técnico emitido en: ${outPath}`);
        process.exit(0);

    } catch (err) {
        console.error('❌ Error generando Technical Report:', err);
        process.exit(1);
    }
}

generateTechnicalReport();
