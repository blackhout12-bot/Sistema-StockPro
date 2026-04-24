const { connectDB, sql } = require('../config/db');
const authRepository = require('../repositories/auth.repository');

async function testPlanUpgrade() {
    console.log("=== INICIANDO VALIDACIÓN DE CAMBIO DE PLANES (v1.29.17) ===");
    const pool = await connectDB();
    let empresaId = null;
    
    try {
        // 1. Crear Empresa de Prueba
        const resEmp = await pool.request().query(`
            INSERT INTO Empresa (nombre, documento_identidad, plan_id) 
            OUTPUT INSERTED.id 
            VALUES ('Empresa Test Planes', 'TEST-PLAN-999', 1);
        `);
        empresaId = resEmp.recordset[0].id;
        console.log(`✅ Empresa de prueba creada (ID: ${empresaId})`);

        // 2. Definir los planes a probar
        const planes = [
            { id: 1, nombre: 'Retail Básico' },
            { id: 2, nombre: 'Logística Avanzada' },
            { id: 3, nombre: 'Manufactura Pro' },
            { id: 4, nombre: 'Servicios Premium' },
            { id: 5, nombre: 'Full Enterprise' }
        ];

        for (const plan of planes) {
            console.log(`\n⏳ Probando cambio a Plan ID: ${plan.id} (${plan.nombre})...`);
            
            // Aplicar cambio de plan
            await authRepository.actualizarPlanEmpresa(empresaId, plan.id);
            console.log(`   - DB: Plan actualizado exitosamente.`);

            // Validar feature toggles (modulos_json)
            const toggles = await authRepository.generarFeatureToggles(plan.id);
            
            if (plan.id === 5) {
                if (toggles['*']) {
                    console.log(`   - UI: Feature Toggles detectados correctamente (Acceso Total *).`);
                } else {
                    throw new Error("Fallo en validación de Full Enterprise (*)");
                }
            } else {
                const modulos = Object.keys(toggles).filter(k => toggles[k]);
                console.log(`   - UI: Módulos activos detectados: [${modulos.join(', ')}]`);
                if (modulos.length === 0) {
                    throw new Error(`El Plan ${plan.nombre} no tiene módulos configurados.`);
                }
            }

            // Validar persistencia real
            const checkDB = await pool.request()
                .input('eid', sql.Int, empresaId)
                .query('SELECT plan_id FROM Empresa WHERE id = @eid');
            
            if (checkDB.recordset[0].plan_id === plan.id) {
                console.log(`   - Verificación DB: OK`);
            } else {
                throw new Error(`Fallo de persistencia: Se esperaba ID ${plan.id}, se obtuvo ${checkDB.recordset[0].plan_id}`);
            }
        }

        console.log("\n🎉 TODAS LAS TRANSICIONES DE PLANES COMPLETADAS CON ÉXITO.");

    } catch (e) {
        console.error("\n❌ ERROR EN TEST DE PLANES:", e.message);
    } finally {
        if (empresaId) {
            console.log(`\n🧹 Limpiando empresa de prueba ${empresaId}...`);
            await authRepository.eliminarEmpresas([empresaId]);
            console.log("✅ Limpieza completada.");
        }
        process.exit(0);
    }
}

testPlanUpgrade();
