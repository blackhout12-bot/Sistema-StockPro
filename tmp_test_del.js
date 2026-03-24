const api = require('./src/modules/delegaciones/delegaciones.model.js');

async function test() {
   try {
      console.log('Testing getAll...');
      await api.getAll();
      console.log('getAll: OK');
      
      console.log('Testing getByUserId...');
      await api.getByUserId(1);
      console.log('getByUserId: OK');
      
      console.log('Testing create...');
      await api.create(1, {delegado_id: 2, rol_asignado: 'encargado', fecha_fin: ''});
      console.log('create: OK');
      
      console.log('Testing revoke...');
      await api.revoke(1, 1);
      console.log('revoke: OK');
      
      console.log('All model functions passed.');
      process.exit(0);
   } catch(e) {
      console.error('FAILED:', e.message || e);
      process.exit(1);
   }
}
test();
