const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('PAGE LOG ERROR:', msg.text());
                // also try to log args
                const promiseArgs = msg.args().map(arg => arg.jsonValue().catch(() => ''));
                Promise.all(promiseArgs).then(args => {
                    if (args.length) console.log('PAGE LOG ERROR ARGS:', args);
                });
            }
        });
        
        page.on('pageerror', error => {
            console.log('PAGE ERROR EXCEPTION:', error.message);
        });
        
        page.on('requestfailed', request => {
            if (!request.url().includes('favicon.ico')) {
                console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText);
            }
        });
        
        console.log("Navigating to http://localhost:5174...");
        await page.goto('http://localhost:5174', { waitUntil: 'networkidle0', timeout: 15000 });
        
        console.log("Waiting 3s for React issues to appear...");
        await new Promise(r => setTimeout(r, 3000));
        
        await browser.close();
        console.log("Done.");
    } catch(e) {
        console.error("Script failed:", e.message);
    }
})();
