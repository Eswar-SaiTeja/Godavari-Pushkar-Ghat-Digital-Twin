const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '../qa_screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runVisualQA() {
  console.log('--- STARTING DAY 1 VISUAL QA & GIS VALIDATION ---');
  
  const browser = await puppeteer.launch({
    executablePath: '/home/quantex/simulator/chrome/linux-156.0.8078.80/chrome-linux64/chrome',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--ignore-gpu-blocklist',
      '--window-size=1920,1080',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const consoleLogs = [];
  const consoleErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  console.log('1. Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 });

  // Wait for Cesium canvas to be ready and loading overlay to dismiss
  console.log('2. Waiting for Cesium 3D canvas and UI to stabilize...');
  await page.waitForSelector('.cesium-widget canvas', { timeout: 15000 });
  await page.waitForTimeout(4000);

  // Screenshot 1: Overview Command Center
  const sc1 = path.join(SCREENSHOT_DIR, '01_command_center_overview.png');
  await page.screenshot({ path: sc1 });
  console.log('✓ Captured Screenshot 1: 01_command_center_overview.png');

  // Verify Location Info Panel
  console.log('3. Validating Location Info Panel & selecting Kotilingala Ghat...');
  const kotilingalaBtn = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('Kotilingala'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Kotilingala selection result:', kotilingalaBtn);
  await page.waitForTimeout(2500);

  const sc2 = path.join(SCREENSHOT_DIR, '02_location_inspector_kotilingala.png');
  await page.screenshot({ path: sc2 });
  console.log('✓ Captured Screenshot 2: 02_location_inspector_kotilingala.png');

  // Open Layer Controls
  console.log('4. Testing GIS Layer Controls panel...');
  await page.evaluate(() => {
    const layerBtns = Array.from(document.querySelectorAll('button'));
    const btn = layerBtns.find(b => b.textContent && b.textContent.includes('Layers'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(1000);

  const sc3 = path.join(SCREENSHOT_DIR, '03_layer_controls_open.png');
  await page.screenshot({ path: sc3 });
  console.log('✓ Captured Screenshot 3: 03_layer_controls_open.png');

  // Test Simulation Mode Switch to Monsoon Flood
  console.log('5. Testing Simulation Scenario switch (Monsoon Surge)...');
  await page.evaluate(() => {
    const select = document.querySelector('#sim-mode');
    if (select) {
      select.value = 'MONSOON_FLOOD';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await page.waitForTimeout(2500);

  const sc4 = path.join(SCREENSHOT_DIR, '04_monsoon_surge_scenario.png');
  await page.screenshot({ path: sc4 });
  console.log('✓ Captured Screenshot 4: 04_monsoon_surge_scenario.png');

  // Test Mobile Viewport
  console.log('6. Testing Mobile responsive viewport (390 x 844)...');
  await page.setViewport({ width: 390, height: 844 });
  await page.waitForTimeout(1500);

  const sc5 = path.join(SCREENSHOT_DIR, '05_mobile_responsive_view.png');
  await page.screenshot({ path: sc5 });
  console.log('✓ Captured Screenshot 5: 05_mobile_responsive_view.png');

  await browser.close();

  console.log('\n--- QA CONSOLE ERRORS AUDIT ---');
  if (consoleErrors.length === 0) {
    console.log('✓ ZERO runtime page errors detected!');
  } else {
    console.log(`Encountered ${consoleErrors.length} errors:`, consoleErrors);
  }

  console.log('\n--- QA VALIDATION COMPLETE ---');
}

runVisualQA().catch(err => {
  console.error('QA script failed:', err);
  process.exit(1);
});
