// import { getCategory } from "./scrapeUtils/getCategory.js";
import { getCharacteristics } from "./scrape/scrapeUtils/getCharacteristics.js";
import { getDescription } from "./scrape/scrapeUtils/getDescription.js";
import { getImages } from "./scrape/scrapeUtils/getImages.js";
import { getPrice } from "./scrape/scrapeUtils/getPrice.js";
import { getTitle } from "./scrapers/getTitle.js
import { randomUserAgent } from "./utils/randomUserAgent.js";

export async function scrape(urls) {
  const products = [];

  const imagesUrls = new Set();

  page.on("response", (res) => {
    if (
      res.request().resourceType() === "image"
      // res.request().resourceType() === "image" &&
      // res.url().includes("/goods/images/big")
    ) {
      imagesUrls.add(res.url());
    }
  });

  await page.setUserAgent(randomUserAgent);
  await page.goto(url, {
    waitUntil: "domcontentloaded",
  });

  products.push({
    entry: entry,
    left: 0,
    brand: brand,
    name: await getTitle(page),
    price: await getPrice(page),
    description: await getDescription(page),
    characteristics: await getCharacteristics(page),
    images: await getImages(page, product, imagesUrls, brand),
  });
}
