const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
        await page.evaluate(() => localStorage.clear());
        
        await page.type('input[type="email"]', 'admin@empresa.com');
        await page.type('input[type="password"]', 'password123'); 
        await page.click('button[type="submit"]');
        
        await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
        await new Promise(r => setTimeout(r, 2000));
        
        const el = await page.evaluate(() => {
            const t = document.querySelector('#tour-facturacion');
            if (!t) return "NO ENCONTRADO";
            const rect = t.getBoundingClientRect();
            return `ENCONTRADO: display=${getComputedStyle(t).display}, width=${rect.width}, height=${rect.height}`;
        });
        
        console.log("RESULTADO:", el);
        
        await browser.close();
    } catch(err) {
        console.error(err);
    }
})();
