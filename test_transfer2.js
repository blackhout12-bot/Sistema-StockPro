require('dotenv').config();
const { connectDB, sql } = require('./src/config/db');
const TransferenciasController = require('./src/modules/movimientos/transferencias.controller');

async function test() {
    try {
        const pool = await connectDB();
        
        // Find valid deposits
        const deps = await pool.request().query('SELECT id FROM Depositos WHERE empresa_id = 1 AND activo = 1');
        if (deps.recordset.length < 2) {
            console.log("NOT ENOUGH DEPOSITS IN DB TO TRANSFER!", deps.recordset);
            process.exit(0);
        }
        
        // Find valid product with stock
        const prods = await pool.request().query('SELECT id, stock FROM Productos WHERE empresa_id = 1 AND stock > 0');
        if (prods.recordset.length === 0) {
            console.log("NO PRODUCTS WITH STOCK!");
            process.exit(0);
        }

        const origen_id = deps.recordset[0].id;
        const destino_id = deps.recordset[1].id;
        const producto_id = prods.recordset[0].id;
        
        console.log(`Trying transfer: origen=${origen_id}, destino=${destino_id}, prod=${producto_id}, qty=1`);

        let req = {
            user: { id: 1, empresa_id: 1 },
            body: { origen_id, destino_id, producto_id, cantidad: 1, motivo: 'test' }
        };

        let res = {
            status: function(s) { this.statusCode = s; return this; },
            json: function(o) { console.log("Response JSON:", this.statusCode, o); }
        };

        await TransferenciasController.transferir(req, res, (err) => {
            console.error("Next Error Handler:", err);
        });

    } catch(e) {
        console.error("Test Error:", e);
    }
}
test();
