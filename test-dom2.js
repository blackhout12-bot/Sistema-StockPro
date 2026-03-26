const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
        await page.evaluate(() => localStorage.clear());
        
        await page.type('input[type="email"]', 'admin@empresa.com');
        await page.type('input[type="password"]', 'password123'); 
        await page.click('button[type="submit"]');
        
        await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
        await new Promise(r => setTimeout(r, 2000));
        
        const result = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a')).map(a => ({
                id: a.id,
                href: a.href,
                text: a.innerText.trim()
            }));
        });
        
        console.log("RESULTADO JSON:", JSON.stringify(result, null, 2));
        
        await browser.close();
    } catch(err) {
        console.error(err);
    }
})();
