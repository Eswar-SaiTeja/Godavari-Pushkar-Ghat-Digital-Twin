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
  console.log('Navigating to http://localhost:5173/?ai=open ...');
  await page.goto('http://localhost:5173/?ai=open', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(4000);

  // 1. AI COPILOT & STATUS BAR SCREENSHOT
  console.log('Capturing AI Copilot Command Dashboard & Status Bar...');
  const copilotPath = path.join(LOCAL_QA_DIR, 'ai_copilot_command_dashboard.png');
  await page.screenshot({ path: copilotPath });
  fs.copyFileSync(copilotPath, path.join(ARTIFACT_DIR, 'ai_copilot_command_dashboard.png'));
  console.log('Saved ai_copilot_command_dashboard.png');

  // 2. OPERATIONS REPORTS GENERATOR TAB
  console.log('Switching to Operations Reports tab...');
  const reportBtns = await page.$$('button');
  for (const b of reportBtns) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('Operations Reports')) {
      await b.click();
      await sleep(1500);
      break;
    }
  }

  const reportsPath = path.join(LOCAL_QA_DIR, 'ai_operations_reports_generator.png');
  await page.screenshot({ path: reportsPath });
  fs.copyFileSync(reportsPath, path.join(ARTIFACT_DIR, 'ai_operations_reports_generator.png'));
  console.log('Saved ai_operations_reports_generator.png');

  // 3. MULTILINGUAL ANNOUNCEMENT GENERATOR TAB
  console.log('Switching to PA Announcements tab...');
  const annBtns = await page.$$('button');
  for (const b of annBtns) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('PA Announcements')) {
      await b.click();
      await sleep(1500);
      break;
    }
  }

  const annPath = path.join(LOCAL_QA_DIR, 'ai_multilingual_announcement_generator.png');
  await page.screenshot({ path: annPath });
  fs.copyFileSync(annPath, path.join(ARTIFACT_DIR, 'ai_multilingual_announcement_generator.png'));
  console.log('Saved ai_multilingual_announcement_generator.png');

  // 4. CROWD FORECAST TAB
  console.log('Switching to Crowd Forecast tab...');
  const forecastBtns = await page.$$('button');
  for (const b of forecastBtns) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('Crowd Forecast')) {
      await b.click();
      await sleep(1500);
      break;
    }
  }

  const forecastPath = path.join(LOCAL_QA_DIR, 'ai_crowd_predictions_visualizer.png');
  await page.screenshot({ path: forecastPath });
  fs.copyFileSync(forecastPath, path.join(ARTIFACT_DIR, 'ai_crowd_predictions_visualizer.png'));
  console.log('Saved ai_crowd_predictions_visualizer.png');

  // 5. EVACUATION A* TAB
  console.log('Switching to Evacuation A* tab...');
  const evacBtns = await page.$$('button');
  for (const b of evacBtns) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('Evacuation A*')) {
      await b.click();
      await sleep(1500);
      break;
    }
  }

  const evacPath = path.join(LOCAL_QA_DIR, 'ai_evacuation_optimization_comparison.png');
  await page.screenshot({ path: evacPath });
  fs.copyFileSync(evacPath, path.join(ARTIFACT_DIR, 'ai_evacuation_optimization_comparison.png'));
  console.log('Saved ai_evacuation_optimization_comparison.png');

  await browser.close();
  console.log('All QA screenshots captured and copied successfully!');
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
