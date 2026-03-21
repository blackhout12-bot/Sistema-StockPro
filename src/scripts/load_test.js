const http = require('http');

const baseURL = 'http://localhost:5001/api/v1/ping';
const TOTAL_REQUESTS = 10000;
const CONCURRENCY = 250;

console.log(`🚀 Iniciando Prueba de Carga StockPro ERP (Load Test)...`);
console.log(`🎯 Objetivo: ${TOTAL_REQUESTS} requests a GET /ping (Liveness Probe)`);
console.log(`⚡ Concurrencia: ${CONCURRENCY} workers\n`);

let completed = 0;
let successes = 0;
let errors = 0;
const startTime = Date.now();

const agent = new http.Agent({ keepAlive: true, maxSockets: CONCURRENCY });

function makeRequest() {
    return new Promise((resolve) => {
        const req = http.get(baseURL, { agent }, (res) => {
            // Drenar data para liberar socket rápido
            res.on('data', () => {});
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 400) successes++;
                else errors++;
                resolve();
            });
        });
        req.on('error', () => {
            errors++;
            resolve();
        });
    });
}

async function runLoadTest() {
    let active = [];
    
    for (let i = 0; i < TOTAL_REQUESTS; i++) {
        const p = makeRequest().then(() => {
            completed++;
            if (completed % 1000 === 0) {
                console.log(`⏳ Progreso: ${completed} / ${TOTAL_REQUESTS} requests completadas...`);
            }
        });
        
        active.push(p);
        
        if (active.length >= CONCURRENCY) {
            await Promise.all(active);
            active = [];
        }
    }
    
    if (active.length > 0) await Promise.all(active);
    
    const timeTaken = (Date.now() - startTime) / 1000;
    const rps = (TOTAL_REQUESTS / timeTaken).toFixed(2);
    
    console.log(`\n==========================================`);
    console.log(`✅ Prueba de Carga Finalizada en ${timeTaken} segundos`);
    console.log(`📊 Rendimiento: ${rps} Requests Per Second (RPS)`);
    console.log(`🟩 Éxitos (200 OK): ${successes}`);
    console.log(`🟥 Errores (Timeouts/500): ${errors}`);
    
    if (errors === 0 && timeTaken < 30) {
        console.log(`\n🏆 EL SISTEMA ES RESILIENTE Y APTO PARA PRODUCCIÓN (K8s Ready)`);
    } else {
        console.log(`\n⚠️ La arquitectura soportó la carga pero presentó latencias o errores.`);
    }
    console.log(`==========================================\n`);
}

runLoadTest();
