// tests/stress_sync.js
const { io } = require("socket.io-client");

const TENANT_ID = 1; // Ajustar según sea necesario
const SOCKET_URL = `http://127.0.0.1:5000/tenant-${TENANT_ID}`;

console.log(`🚀 Iniciando prueba de stress para WebSocket en ${SOCKET_URL}...`);

const socket = io(SOCKET_URL);

let received = 0;
const start = Date.now();

socket.on("connect", () => {
    console.log("✅ Conectado al namespace del tenant.");
    socket.emit("join-room", "product-test");
});

socket.on("stock-update", (data) => {
    received++;
    if (received % 100 === 0) {
        console.log(`📩 Recibidos ${received} eventos de sincronización...`);
    }
});

// Simular 1000 actualizaciones rápidas desde otra conexión o proceso
setTimeout(() => {
    console.log("⌛ Monitoreando tráfico durante 10 segundos...");
}, 1000);

setTimeout(() => {
    console.log(`🏁 Prueba completada. Eventos recibidos: ${received}`);
    console.log(`⏱️ Tiempo total: ${(Date.now() - start) / 1000}s`);
    process.exit(0);
}, 12000);
