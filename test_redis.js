const { redisClient } = require('./src/config/redis');

async function testRedis() {
  console.log('Probando conexión a Redis...');
  try {
    await redisClient.set('test_key', 'Hola desde Stock-System');
    const value = await redisClient.get('test_key');
    console.log('Valor recuperado de Redis:', value);
    if (value === 'Hola desde Stock-System') {
      console.log('✅ Conexión a Redis Exitosa.');
    } else {
      console.log('❌ Valor incorrecto.');
    }
  } catch (error) {
    console.error('❌ Error conectando a Redis:', error.message);
  } finally {
    redisClient.quit();
    process.exit(0);
  }
}

testRedis();
