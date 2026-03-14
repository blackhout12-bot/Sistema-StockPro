const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testChromeDownload() {
    console.log('Iniciando Puppeteer para testear descarga en Chrome...');
    
    // Directorio de descargas de prueba
    const downloadPath = path.resolve(__dirname, 'chrome_test_downloads');
    if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Configurar comportamiento de descarga
    const client = await page.createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadPath
    });

    // Login
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Rellenamos el login
    try {
        await page.type('input[type="email"]', 'edgardo@example.com');
        await page.type('input[type="password"]', 'Edgardo2026!');
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        console.log('Login OK');
        
        // Vamos a facturación
        await page.goto('http://localhost:5173/facturacion', { waitUntil: 'networkidle0' });
        console.log('Página de facturación cargada');
        
        // Seleccionamos la primera empresa si hay modal
        try {
            await page.waitForSelector('button.bg-primary-600', { timeout: 3000 });
            await page.click('button.bg-primary-600');
            console.log('Empresa seleccionada');
            await new Promise(r => setTimeout(r, 1000));
        } catch(e) { /* ignored */ }
        
        // Interceptamos la red para ver el PDF
        page.on('response', async (response) => {
            if (response.url().includes('/pdf')) {
                console.log('--- RESPUESTA DEL ENDPOINT PDF ---');
                console.log('Status:', response.status());
                console.log('Headers:', response.headers());
            }
        });

        // Buscamos el botón "Ver PDF" en el historial
        const btn = await page.$('button svg.lucide-file-text');
        if (btn) {
            console.log('Clickeando botón de descarga...');
            await btn.click();
            
            // Esperamos unos segundos para la descarga
            await new Promise(r => setTimeout(r, 6000));
            
            // Revisamos qué archivos hay en la carpeta de prueba
            const files = fs.readdirSync(downloadPath);
            console.log('--- ARCHIVOS EN CARPETA DE DESCARGA DE CHROME ---');
            console.log(files);
            
        } else {
            console.log('No se encontró el botón de PDF en el histórico');
        }

    } catch (e) {
        console.error('Error durante la automatización:', e);
    } finally {
        await browser.close();
    }
}

testChromeDownload();
