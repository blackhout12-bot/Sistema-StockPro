const fs = require('fs');
const text = fs.readFileSync('dev_output.log', 'utf8');
const count = (text.match(/"url": "\/api\/v1\/auth\/login"/g) || []).length;
console.log('Login calls:', count);
