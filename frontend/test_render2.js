const puppeteer = require('puppeteer');
(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setViewport({ width: 1536, height: 730 });

        // Setup listener para logs del cliente
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

        await page.goto('http://localhost:3000/login');
        await page.waitForSelector('input[type="email"]');

        await page.type('input[type="email"]', 'admin@demo.com'); // Probar con admin
        await page.type('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        console.log("Navegando a facturacion...");
        await page.goto('http://localhost:3000/facturacion', { waitUntil: 'networkidle0' });

        await new Promise(r => setTimeout(r, 2000));

        await page.screenshot({ path: 'C:\\Users\\egar0\\.gemini\\antigravity\\brain\\419dc36a-59aa-4e6e-b4a3-32754e95915f\\facturacion_restored_2.png' });
        console.log("Done");

        await browser.close();
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
})();
