require('dotenv').config();
const { connectDB, sql } = require('./src/config/db');
const productoRepo = require('./src/repositories/producto.repository');

async function testUpdate() {
    try {
        const pool = await connectDB();
        const p = await pool.request().query('SELECT TOP 1 * FROM Productos');
        const prod = p.recordset[0];
        console.log("Updating product:", prod.id);

        // Mock pool to intercept query
        let queryCaptured = '';
        const mockPool = {
            request: () => {
                const req = pool.request();
                const origQuery = req.query.bind(req);
                req.query = async (q) => {
                    if (q.includes('UPDATE Productos')) {
                        queryCaptured = q;
                    }
                    return origQuery(q);
                };
                return req;
            }
        };

        await productoRepo.update(mockPool, prod.id, prod, prod.empresa_id);
        console.log("Captured Query:", queryCaptured);
        
        const check = await pool.request().query('SELECT actualizado_en FROM Productos WHERE id = ' + prod.id);
        console.log("Updated Value:", check.recordset[0].actualizado_en);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
testUpdate();
