import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { getRandomUserAgent } from "../globals/randomUserAgent.js";
puppeteer.use(StealthPlugin());

const notFoundSelector = "div.search-nothing__buttons-wrapper";
const searchSelector = "a.goods-tile__heading";
const landingSelector =
  "h1.product__title-left.product__title-collapsed.ng-star-inserted";

export async function searchFor(page, entry, retryCount = 0) {
  let product = { entry: entry, url: null };
  try {
    // Increased random delay with exponential backoff for retries
    const baseDelay = Math.random() * 2000 + 1000; // 1-3 seconds
    const retryDelay = retryCount * 1000; // Additional delay for retries
    const totalDelay = baseDelay + retryDelay;
    await new Promise((r) => setTimeout(r, totalDelay));

    // Rotate user agent for each request
    await page.setUserAgent(getRandomUserAgent());
    
    // Add mouse movement simulation
    await simulateHumanBehavior(page);
    
    // Navigate with timeout handling
    const searchUrl = "https://rozetka.com.ua/ua/search?text=" + encodeURIComponent(entry);
    await page.goto(searchUrl, {
      waitUntil: "networkidle2",
      timeout: 30000
    });

    // Random scroll to simulate human behavior
    await randomScroll(page);

    // Wait for selectors with increased timeout
    const selector = await Promise.race([
      page.waitForSelector(searchSelector, { timeout: 15000 }).then(() => searchSelector),
      page.waitForSelector(landingSelector, { timeout: 15000 }).then(() => landingSelector),
      page.waitForSelector(notFoundSelector, { timeout: 15000 }).then(() => notFoundSelector),
    ]);

    if (selector === searchSelector) {
      // Wait a bit before clicking
      await new Promise(r => setTimeout(r, Math.random() * 1000 + 500));
      product = { entry: entry, url: await getLandingProductUrl(page) };
    } else if (selector === landingSelector) {
      product = { entry: entry, url: page.url() };
    }

    console.log(product);
  } catch (e) {
    console.log(`Error for entry "${entry}": ${e.message}`);
    
    // Retry logic with exponential backoff
    if (retryCount < 3) {
      console.log(`Retrying... (attempt ${retryCount + 1}/3)`);
      return await searchFor(page, entry, retryCount + 1);
    }
  }

  return product;
}

async function simulateHumanBehavior(page) {
  // Random mouse movements
  const viewport = page.viewport();
  for (let i = 0; i < 3; i++) {
    const x = Math.random() * viewport.width;
    const y = Math.random() * viewport.height;
    await page.mouse.move(x, y, { steps: Math.floor(Math.random() * 10) + 5 });
    await new Promise(r => setTimeout(r, Math.random() * 100 + 50));
  }
}

async function randomScroll(page) {
  const scrollCount = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < scrollCount; i++) {
    const scrollY = Math.random() * 500 + 200;
    await page.evaluate((y) => window.scrollBy(0, y), scrollY);
    await new Promise(r => setTimeout(r, Math.random() * 500 + 200));
  }
  
  // Scroll back to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, Math.random() * 300 + 100));
}

async function getLandingProductUrl(page) {
  const anchor = await page.$(searchSelector);
  if (!anchor) {
    throw new Error('Product link not found');
  }
  const productLandingUrl = await page.evaluate((el) => el.href, anchor);
  return productLandingUrl;
}
