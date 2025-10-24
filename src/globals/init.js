import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import RecaptchaPlugin from "puppeteer-extra-plugin-recaptcha";

// Enhanced stealth configuration
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
puppeteer.use(RecaptchaPlugin());

import { getRandomUserAgent, getRandomViewport } from "./randomUserAgent.js";

export const START_URL = "https://rozetka.com.ua/ua/";

export async function init(startUrl) {
  const randomViewport = getRandomViewport();
  
  const browser = await puppeteer.launch({
    headless: "new", // Use new headless mode
    defaultViewport: randomViewport,
    executablePath: "google-chrome-stable",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-extensions',
      '--disable-default-apps',
      '--disable-sync',
      '--disable-translate',
      '--hide-scrollbars',
      '--mute-audio',
      '--no-default-browser-check',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-ipc-flooding-protection',
      `--window-size=${randomViewport.width},${randomViewport.height}`
    ],
  });

  const page = await browser.newPage();
  
  // Enhanced user agent rotation
  const userAgent = getRandomUserAgent();
  await page.setUserAgent(userAgent);
  
  // Set random viewport
  await page.setViewport(randomViewport);
  
  // Enhanced browser fingerprint randomization
  await page.evaluateOnNewDocument(() => {
    // Randomize screen properties
    Object.defineProperty(screen, 'width', { value: Math.floor(Math.random() * 500) + 1200 });
    Object.defineProperty(screen, 'height', { value: Math.floor(Math.random() * 300) + 800 });
    Object.defineProperty(screen, 'availWidth', { value: screen.width });
    Object.defineProperty(screen, 'availHeight', { value: screen.height - 40 });
    
    // Randomize timezone
    const timezones = ['Europe/Kiev', 'Europe/Warsaw', 'Europe/Berlin', 'Europe/London'];
    const randomTimezone = timezones[Math.floor(Math.random() * timezones.length)];
    Object.defineProperty(Intl.DateTimeFormat.prototype, 'resolvedOptions', {
      value: function() {
        return { timeZone: randomTimezone };
      }
    });
    
    // Spoof webdriver property
    Object.defineProperty(navigator, 'webdriver', { value: false });
    
    // Randomize memory
    Object.defineProperty(navigator, 'deviceMemory', { value: Math.pow(2, Math.floor(Math.random() * 3) + 1) });
    
    // Randomize platform
    const platforms = ['Win32', 'MacIntel', 'Linux x86_64'];
    Object.defineProperty(navigator, 'platform', { value: platforms[Math.floor(Math.random() * platforms.length)] });
  });
  
  // Set random headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8,ru;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  });

  // Navigate with random delay
  const delay = Math.random() * 2000 + 1000;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  await page.goto(startUrl, {
    waitUntil: "networkidle2",
    timeout: 30000
  });

  await page.setCacheEnabled(false);

  return { browser, page };
}
