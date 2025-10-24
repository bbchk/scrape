import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { randomUserAgent } from "../globals/randomUserAgent.js";
puppeteer.use(StealthPlugin());

const notFoundSelector = "div.search-nothing__buttons-wrapper";
const searchSelector = "a.goods-tile__heading";
const landingSelector =
  "h1.product__title-left.product__title-collapsed.ng-star-inserted";

export async function searchFor(page, entry) {
  let product = { entry: entry, url: null };
  try {
    const delay = Math.random() * 1000 + 500; // Generates a random number between 500 and 1500
    await new Promise((r) => setTimeout(r, delay)); //time delay to mimic human slowness

    await page.setUserAgent(randomUserAgent);
    await page.goto(
      "https://rozetka.com.ua/ua/search?text=" + encodeURIComponent(entry)
    );

    //is landed on individual product page or search page
    const selector = await Promise.race([
      page.waitForSelector(searchSelector).then(() => searchSelector),
      page.waitForSelector(landingSelector).then(() => landingSelector),
      page.waitForSelector(notFoundSelector).then(() => notFoundSelector),
    ]);

    if (selector === searchSelector) {
      product = { entry: entry, url: await getLandingProductUrl(page) };
    } else if (selector === landingSelector) {
      product = { entry: entry, url: page.url() };
    }

    console.log(product);
  } catch (e) {
    console.log(e.message);
  }

  return product;
}

async function getLandingProductUrl(page) {
  const anchor = await page.$(searchSelector);
  const productLandingUrl = await page.evaluate((el) => el.href, anchor);
  return productLandingUrl;
}
