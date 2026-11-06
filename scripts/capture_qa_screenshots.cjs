const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/home/quantex/simulator/chrome/linux-156.0.8078.80/chrome-linux64/chrome';
const ARTIFACT_DIR = '/home/quantex/.gemini/antigravity/brain/6f042598-2f0d-4f85-a8f6-5d216186f88d';
const LOCAL_QA_DIR = path.join(__dirname, '..', 'qa_screenshots');

if (!fs.existsSync(LOCAL_QA_DIR)) {
  fs.mkdirSync(LOCAL_QA_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function capture() {
  console.log('Launching Linux Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--ignore-gpu-blocklist',
      '--window-size=1600,960',
    ],
    defaultViewport: {
      width: 1600,
      height: 960,
    },
  });

  const page = await browser.newPage();
  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(4000); // Allow Cesium & UI to stabilize

  console.log('Clicking Operations Command Center button in header...');
  // Find button with title Toggle Day 4 Event Operations Command Center
  const opsBtn = await page.$('button[title*="Operations Command Center"]');
  if (opsBtn) {
    await opsBtn.click();
    await sleep(1500);
  } else {
    console.log('Could not find opsBtn by title, searching by text...');
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('Operations')) {
        await b.click();
        await sleep(1500);
        break;
      }
    }
  }

  // 1. DISPATCH CONSOLE SCREENSHOT
  console.log('Switching to Dispatch Console tab...');
  const tabButtons = await page.$$('button');
  for (const b of tabButtons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('Dispatch Console')) {
      await b.click();
      await sleep(1500);
      break;
    }
  }

  const dispatchScreenshotPath = path.join(LOCAL_QA_DIR, 'dispatch_management_console.png');
  await page.screenshot({ path: dispatchScreenshotPath, fullPage: false });
  console.log(`Saved ${dispatchScreenshotPath}`);

  // Copy to artifact dir
  fs.copyFileSync(dispatchScreenshotPath, path.join(ARTIFACT_DIR, 'dispatch_management_console.png'));

  // 2. OPERATIONS ANALYTICS SCREENSHOT
  console.log('Switching to Operations Analytics tab...');
  const tabButtons2 = await page.$$('button');
  for (const b of tabButtons2) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('Operations Analytics')) {
      await b.click();
      await sleep(1500);
      break;
    }
  }

  const analyticsScreenshotPath = path.join(LOCAL_QA_DIR, 'operations_analytics_dashboard.png');
  await page.screenshot({ path: analyticsScreenshotPath, fullPage: false });
  console.log(`Saved ${analyticsScreenshotPath}`);

  // Copy to artifact dir
  fs.copyFileSync(analyticsScreenshotPath, path.join(ARTIFACT_DIR, 'operations_analytics_dashboard.png'));

  // 3. OVERVIEW / GLOBE VIEW SCREENSHOT
  console.log('Switching to Overview tab...');
  const tabButtons3 = await page.$$('button');
  for (const b of tabButtons3) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('Operations Overview')) {
      await b.click();
      await sleep(1200);
      break;
    }
  }

  const overviewScreenshotPath = path.join(LOCAL_QA_DIR, 'event_operations_overview.png');
  await page.screenshot({ path: overviewScreenshotPath, fullPage: false });
  console.log(`Saved ${overviewScreenshotPath}`);
  fs.copyFileSync(overviewScreenshotPath, path.join(ARTIFACT_DIR, 'event_operations_overview.png'));

  await browser.close();
  console.log('QA screenshots successfully captured and copied to artifact directory!');
}

capture().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
