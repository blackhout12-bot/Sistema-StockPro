const puppeteer = require('puppeteer');
(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setViewport({ width: 1536, height: 730 });

        console.log("Navegando al login...");
        await page.goto('http://localhost:3000/login');
        await page.type('input[type="email"]', 'test@demo.com');
        await page.type('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        console.log("Esperando navegación de login...");
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        console.log("Navegando a facturacion...");
        await page.goto('http://localhost:3000/facturacion', { waitUntil: 'networkidle0' });

        // Dar tiempo adicional para que el layout anime
        await new Promise(r => setTimeout(r, 2000));

        const screenshotPath = 'C:\\Users\\egar0\\.gemini\\antigravity\\brain\\419dc36a-59aa-4e6e-b4a3-32754e95915f\\facturacion_restored.png';
        await page.screenshot({ path: screenshotPath });
        console.log("Captura guardada en: " + screenshotPath);

        await browser.close();
    } catch (e) {
        console.error("Error en Puppeteer:", e);
        process.exit(1);
    }
})();
