const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const OUT_DIR = path.resolve(__dirname, '..', 'UI output');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function postJson(urlPath, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Fetching auth tokens...');
  const farmerAuth = await postJson('/api/auth/login', { phone: '9876543210', password: 'password123' });
  const buyerAuth = await postJson('/api/auth/login', { phone: '9876500001', password: 'password123' });
  const adminAuth = await postJson('/api/auth/login', { phone: '9000000000', password: 'password123' });

  console.log('Launching Puppeteer Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  async function setSession(authData) {
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate((token, user) => {
      localStorage.setItem('cgm_token', token);
      localStorage.setItem('cgm_user', JSON.stringify(user));
    }, authData.token, authData.user);
  }

  async function snap(filename, delay = 1200) {
    await sleep(delay);
    const dest = path.join(OUT_DIR, filename);
    await page.screenshot({ path: dest });
    console.log(`[OK] Saved: ${filename}`);
  }

  // 1. Login Page
  console.log('1. Login & Authentication Portal');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
  await snap('01_Login_and_Authentication.png', 1000);

  // 2. Farmer Income Dashboard Agent
  console.log('2. Farmer Income Dashboard Agent');
  await setSession(farmerAuth);
  await page.goto('http://localhost:3000/farmer', { waitUntil: 'networkidle0' });
  await snap('02_Farmer_Income_Dashboard_Agent.png', 2000);

  // 3. Realtime Mandi Prices & Market Trends
  console.log('3. Realtime Mandi Prices & Trends');
  await page.goto('http://localhost:3000/farmer/mandi-prices', { waitUntil: 'networkidle0' });
  await snap('03_Realtime_Mandi_Prices_and_Trends.png', 2000);

  // 4. Mandi Price Forecasting Agent
  console.log('4. Mandi Price Forecasting Agent');
  await page.goto('http://localhost:3000/farmer/forecast', { waitUntil: 'networkidle0' });
  await sleep(1000);
  const forecastBtn = await page.$('button.btn-primary');
  if (forecastBtn) {
    await forecastBtn.click();
    await sleep(2500);
  }
  await snap('04_Mandi_Price_Forecasting_Agent.png', 1500);

  // 5. Storage & Selling Advisor Agent
  console.log('5. Storage & Selling Advisor Agent');
  await page.goto('http://localhost:3000/farmer/storage-advice', { waitUntil: 'networkidle0' });
  await sleep(1000);
  const numberInputs = await page.$$('input[type="number"]');
  if (numberInputs.length >= 2) {
    await numberInputs[0].type('100');
    await numberInputs[1].type('7450');
  }
  const adviceBtn = await page.$('button[type="submit"]');
  if (adviceBtn) {
    await adviceBtn.click();
    await sleep(2500);
  }
  await snap('05_Storage_and_Selling_Advisor_Agent.png', 1500);

  // 6. Quality Grading Assistant Agent
  console.log('6. Quality Grading Assistant Agent');
  await page.goto('http://localhost:3000/farmer/quality-check', { waitUntil: 'networkidle0' });
  await sleep(1000);
  const notesText = await page.$('textarea');
  if (notesText) {
    await notesText.type('Shankar-6 Cotton with bright white luster, staple length 29.5mm, moisture content 7.5%, negligible trash.');
  }
  const gradeBtn = await page.$('button[type="submit"]');
  if (gradeBtn) {
    await gradeBtn.click();
    await sleep(2500);
  }
  await snap('06_Quality_Grading_Assistant_Agent.png', 1500);

  // 7. Farmer Crop Listings & Market Portal
  console.log('7. Farmer Crop Listings Portal');
  await page.goto('http://localhost:3000/farmer/listings', { waitUntil: 'networkidle0' });
  await snap('07_Farmer_Crop_Listing_and_Market_Portal.png', 2000);

  // 8. Buyer Direct Matching Agent
  console.log('8. Buyer Direct Matching Agent');
  await setSession(buyerAuth);
  await page.goto('http://localhost:3000/buyer/match', { waitUntil: 'networkidle0' });
  await sleep(1200);
  const matchSelect = await page.$('select');
  if (matchSelect) {
    const opts = await page.$$('select option');
    if (opts.length > 1) {
      const val = await page.evaluate(el => el.value, opts[1]);
      await page.select('select', val);
      await sleep(500);
      const mBtn = await page.$('button.btn-primary');
      if (mBtn) {
        await mBtn.click();
        await sleep(2500);
      }
    }
  }
  await snap('08_Buyer_Direct_Matching_Agent.png', 1500);

  // 9. Buyer Marketplace & Direct Offers
  console.log('9. Buyer Marketplace & Browse Listings');
  await page.goto('http://localhost:3000/buyer/browse', { waitUntil: 'networkidle0' });
  await snap('09_Buyer_Marketplace_and_Offer_Negotiation.png', 2000);

  // 10. Admin Platform Governance and AI Logs
  console.log('10. Admin Platform Governance and AI Logs');
  await setSession(adminAuth);
  await page.goto('http://localhost:3000/admin/ai-logs', { waitUntil: 'networkidle0' });
  await snap('10_Admin_Platform_Governance_and_AI_Logs.png', 2000);

  await browser.close();
  console.log('All 10 screenshots captured successfully!');
}

main().catch(err => {
  console.error('Execution failed:', err);
  process.exit(1);
});
