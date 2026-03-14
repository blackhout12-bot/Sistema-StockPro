const http = require('http');

const req = http.get('http://localhost:5000/api/v1/facturacion/78/pdf?token=dummy', (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);
});
req.on('error', console.error);
