const puppeteer = require('puppeteer');

(async () => {
    console.log('--- SENIOR UI DIAGNOSTIC ---');
    let browser;
    try {
        browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();
        
        page.on('console', msg => {
            if (msg.type() === 'error' || msg.type() === 'warning') {
                console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
            }
        });
        
        page.on('pageerror', err => {
            console.log('[PAGE EXCEPTION]', err.toString());
        });

        console.log('Navegando a localhost:5173...');
        const response = await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 15000 });
        console.log('Status Code:', response.status());
        
        // Esperamos un momento a ver si React hace crash
        await new Promise(r => setTimeout(r, 2000));
        
        const rootContent = await page.$eval('#root', el => el.innerHTML).catch(() => 'NO_ROOT');
        if (!rootContent || rootContent.trim() === '') {
            console.log('WSOD DETECTADO: El #root está completamente en blanco.');
        } else {
            console.log('El #root tiene contenido. (Longitud:', rootContent.length, ')');
        }
        
        // Revisar si Vite Overlay Error está presente
        const viteError = await page.$eval('vite-error-overlay', el => el.shadowRoot.innerHTML).catch(() => null);
        if (viteError) {
             console.log('!!!!!!!!!!!!!!!! VITE ERROR OVERLAY DETECTADO !!!!!!!!!!!!!!!!');
             console.log(viteError.substring(0, 1500));
        }

    } catch (e) {
        console.error('Puppeteer Falló:', e.message);
    } finally {
        if (browser) await browser.close();
    }
})();
