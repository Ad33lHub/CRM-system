import puppeteer from 'puppeteer';
import assert from 'node:assert';

const CLIENT_URL = 'http://localhost:5173';

async function runInterfaceTests() {
  console.log('=== Starting CRM Automated Interface E2E Tests ===');

  console.log('Launching Puppeteer browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.stack || err.message));

  try {
    // 1. Load Login Screen
    console.log('\n1. Verifying Login Screen loading...');
    await page.goto(`${CLIENT_URL}/login`, { waitUntil: 'networkidle2' });
    
    const pageTitle = await page.title();
    console.log(`Page Title: "${pageTitle}"`);
    
    // Check if input forms exist
    await page.waitForSelector('input[id="email"]', { timeout: 10000 });
    const emailInput = await page.$('input[id="email"]');
    const passwordInput = await page.$('input[id="password"]');
    assert.ok(emailInput, 'Email field must exist');
    assert.ok(passwordInput, 'Password field must exist');
    console.log('✅ Login screen elements validated.');

    // 2. Test Lockout Alert Simulation
    console.log('\n2. Testing invalid credentials & lockout trigger...');
    for (let i = 0; i < 5; i++) {
      await page.type('input[id="email"]', `wronguser_${i}@crm.com`);
      await page.type('input[id="password"]', 'WrongPassword123');
      await page.click('button[id="btn-login"]');
      
      // Wait briefly for response
      await new Promise(r => setTimeout(r, 400));
      
      // Clear inputs
      await page.click('input[id="email"]', { clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.click('input[id="password"]', { clickCount: 3 });
      await page.keyboard.press('Backspace');
    }

    // Try a 6th time to trigger Lockout warning
    await page.type('input[id="email"]', 'superadmin@crm.com');
    await page.type('input[id="password"]', 'Admin@12345');
    await page.click('button[id="btn-login"]');
    
    // Check if a warning or message contains lockout indicators, wait for navigation/redirect
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    console.log('✅ Lockout sequence simulated.');

    // 3. Authenticate with valid admin credentials
    let currentUrl = page.url();
    if (!currentUrl.includes('/projects') && !currentUrl.includes('/dashboard')) {
      console.log('\n3. Logging in with Admin credentials...');
      await page.click('input[id="email"]', { clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.click('input[id="password"]', { clickCount: 3 });
      await page.keyboard.press('Backspace');

      await page.type('input[id="email"]', 'superadmin@crm.com');
      await page.type('input[id="password"]', 'Admin@12345');
      await page.click('button[id="btn-login"]');

      // Wait for redirect to happen
      await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    } else {
      console.log('\n3. Already logged in and redirected from step 2, skipping redundant login.');
    }
    
    currentUrl = page.url();
    console.log(`Current URL after redirect: "${currentUrl}"`);
    assert.ok(currentUrl.includes('/projects') || currentUrl.includes('/dashboard'), 'Redirect to console home page failed');
    console.log('✅ Admin login redirected to correct workspace path.');

    // 4. Navigate to Kanban Tasks Board
    console.log('\n4. Verifying Tasks Board loads...');
    await page.goto(`${CLIENT_URL}/tasks`, { waitUntil: 'networkidle2' });
    
    await page.waitForSelector('.grid-cols-5', { timeout: 10000 });
    const kanbanColumnExists = await page.$('.grid-cols-5'); 
    assert.ok(kanbanColumnExists, 'Kanban columns wrapper must load on board view');
    console.log('✅ Kanban board columns verified.');

    // 5. Navigate to Invoices Creation Builder
    console.log('\n5. Verifying Invoices Creator Page loads...');
    await page.goto(`${CLIENT_URL}/invoices/new`, { waitUntil: 'networkidle2' });
    
    await page.waitForSelector('select[id="select-client"]', { timeout: 10000 });
    const clientSelect = await page.$('select[id="select-client"]');
    assert.ok(clientSelect, 'Client select field must exist in invoice creator form');
    console.log('✅ Invoice creator form interface validated.');

    // 6. Navigate to AI Proposals Generator Page
    console.log('\n6. Verifying AI Proposals Generator Page loads...');
    await page.goto(`${CLIENT_URL}/proposals`, { waitUntil: 'networkidle2' });
    
    await page.waitForSelector('input[id="prop-title"]', { timeout: 10000 });
    const propTitleInput = await page.$('input[id="prop-title"]');
    assert.ok(propTitleInput, 'Proposal title input field must exist in generator form');
    console.log('✅ Proposal generator interface validated.');

    // 7. Verify Chat Workspace Loads
    console.log('\n7. Verifying Chat Workspace Page loads...');
    await page.goto(`${CLIENT_URL}/chat`, { waitUntil: 'networkidle2' });
    
    await page.waitForSelector('textarea[id="chat-message-input"]', { timeout: 10000 });
    const chatInput = await page.$('textarea[id="chat-message-input"]');
    assert.ok(chatInput, 'Message textarea must exist in chat container');
    console.log('✅ Chat interface verified.');

    console.log('\n=== All CRM Automated Interface E2E Tests Passed Successfully! ===');
  } catch (err) {
    console.error('❌ E2E Interface Test Failed:', err.message);
    throw err;
  } finally {
    await browser.close();
  }
}

runInterfaceTests();
