const puppeteer = require('puppeteer');

(async () => {
    console.log('Lanzando navegador...');
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('BROWSER ERROR:', msg.text());
        }
    });
    
    page.on('pageerror', err => {
        console.log('PAGE EXCEPTION:', err.toString());
    });

    try {
        console.log('Navegando a localhost:5173...');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 10000 });
        
        const content = await page.content();
        if (content.includes('Error')) {
             console.log('Se encontró la palabra "Error" en el HTML.');
        }
        console.log('HTML Body Length:', content.length);
        
        // Veamos si renderiza el login o el MainLayout
        const hasLogin = await page.evaluate(() => !!document.querySelector('form'));
        const hasRoot = await page.evaluate(() => !!document.getElementById('root'));
        
        console.log('Tiene Formulario:', hasLogin);
        console.log('Tiene div#root:', hasRoot);
        
        // Si hay algún div que diga "Something went wrong" (Error Boundary de React)
        const text = await page.evaluate(() => document.body.innerText);
        console.log('TEXTO EN PANTALLA:', text.substring(0, 500));
        
    } catch (e) {
        console.error('PUPPETEER FALLÓ:', e.message);
    } finally {
        await browser.close();
    }
})();
