const fs = require('fs');
const content = fs.readFileSync('dev_output.log', 'utf8');
const reqs = content.split('INFO: request completed');
const urls = [];
for (const req of reqs) {
    if (req.includes('"statusCode": 401')) {
        const urlMatch = req.match(/"url":\s*"([^"]+)"/);
        if (urlMatch) urls.push(urlMatch[1]);
    }
}
console.log([...new Set(urls.slice(-50))]); 
