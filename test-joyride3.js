const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    // Capture all console logs
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

    console.log('Logging in...');
    await page.type('input[type="email"]', 'admin@tbgestion.com');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('Logged in. URL:', page.url());

    // Reset Tour (simulated via API call)
    console.log('Resetting tour via API equivalent...');
    await page.evaluate(async () => {
        const token = localStorage.getItem('token');
        await fetch('http://localhost:5000/api/v1/auth/me/onboarding/reset', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        localStorage.removeItem('user');
    });
    
    console.log('Reloading to trigger tour...');
    await page.reload({ waitUntil: 'networkidle0' });
    
    // Wait for the Joyride tooltip to appear
    console.log('Waiting for Joyride tooltip...');
    await page.waitForSelector('.react-joyride__tooltip', { visible: true, timeout: 5000 }).catch(e => console.log('Tooltip not found initially'));

    const title = await page.$eval('.react-joyride__tooltip h4', el => el.textContent).catch(() => 'No Title');
    console.log('Step 1 Title:', title);

    // Look for Siguiente button
    console.log('Looking for Siguiente button...');
    const nextBtn = await page.$('button[title="Siguiente"]');
    if (nextBtn) {
        console.log('Clicking Siguiente...');
        await nextBtn.click();
        
        console.log('Waiting 2 seconds for navigation to settle...');
        await new Promise(r => setTimeout(r, 2000));
        console.log('Current URL after click:', page.url());
        
        const isTooltipVisible = await page.$eval('.react-joyride__tooltip', el => el !== null).catch(() => false);
        console.log('Is tooltip still visible in DOM?', isTooltipVisible);
        
        if (isTooltipVisible) {
            const nextTitle = await page.$eval('.react-joyride__tooltip h4', el => el.textContent).catch(() => 'No Title');
            console.log('Next Tooltip Title:', nextTitle);
        }
    } else {
        console.log('Siguiente button not found!');
    }

    await browser.close();
})();
