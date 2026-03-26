const authService = require('./src/modules/auth/auth.service');
const email = 'admin_val_1774497676646@test.local';
const password = 'Admin1234!';

async function verify() {
    try {
        console.log('Verificando login para:', email);
        const result = await authService.login(email, password);
        console.log('LOGIN EXITOSO:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('LOGIN FALLIDO:', err.message);
    } finally {
        process.exit(0);
    }
}
verify();
