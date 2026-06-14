import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', (msg) => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', (err) => console.log('BROWSER ERROR:', err.message));

  console.log('Navigating to http://localhost:5173/login ...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });

  await new Promise((r) => setTimeout(r, 5000));

  await browser.close();
}

run().catch(console.error);
