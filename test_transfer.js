require('dotenv').config();
const { connectDB, sql } = require('./src/config/db');
const TransferenciasController = require('./src/modules/movimientos/transferencias.controller');

async function test() {
    try {
        await connectDB();
        console.log("DB Connected.");
        
        let req = {
            user: { id: 1, empresa_id: 1 },
            body: {
                origen_id: 1,
                destino_id: 2, // Assuming deposit 2 exists
                producto_id: 1,
                cantidad: 1,
                motivo: 'test'
            }
        };

        let res = {
            status: function(s) { 
                this.statusCode = s; 
                return this; 
            },
            json: function(o) {
                console.log("Response:", this.statusCode, o);
            }
        };

        await TransferenciasController.transferir(req, res, (err) => {
            console.error("Next called with Error:", err);
        });

    } catch(e) {
        console.error("Fatal Error:", e);
    }
    process.exit(0);
}
test();
