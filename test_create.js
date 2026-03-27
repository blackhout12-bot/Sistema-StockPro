const { connectDB } = require('./src/config/db');
const productoRepository = require('./src/repositories/producto.repository');

async function testCreate() {
  try {
    const pool = await connectDB();
    console.log('Testing create...');
    const data = {
      nombre: 'TEST SCRIPT ' + Date.now(),
      descripcion: 'Prueba desde script',
      precio: 100,
      stock: 10,
      sku: 'SKU-' + Date.now(),
      categoria_id: null
    };
    const id = await productoRepository.create(pool, data, 1);
    console.log('Created with ID:', id);
  } catch (e) {
    console.error('ERROR EN REPOSITORY:', e);
  }
  process.exit(0);
}
testCreate();
