import { getCategory } from "./scrapeUtils/getCategory.js";
import { getCharacteristics } from "./scrapeUtils/getCharacteristics.js";
import { getDescription } from "./scrapeUtils/getDescription.js";
import { getImages } from "./scrapeUtils/getImages.js";
import { getPrice } from "./scrapeUtils/getPrice.js";
import { getTitle } from "./scrapeUtils/getTitle.js";
import { randomUserAgent } from "../globals/randomUserAgent.js";
import { flash, red, terminator } from "../globals/variables.js";

export async function scrapeSearch(page, productsInfo, brand) {
  const products = [];
  for (const { entry, url } of productsInfo) {
    const imagesUrls = new Set();
    page.on("response", (res) => {
      if (
        res.request().resourceType() === "image" &&
        res.url().includes("/goods/images/big")
      ) {
        imagesUrls.add(res.url());
      }
    });

    await page.setUserAgent(randomUserAgent);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
    });

    const product = { entry: entry, left: 0, brand: brand };

    product.name = await getTitle(page);
    product.price = await getPrice(page);
    product.description = await getDescription(page);
    product.characteristics = await getCharacteristics(page);
    product.category = await getCategory(page, product);
    product.images = await getImages(page, product, imagesUrls, brand);

    console.log(product, `\n${terminator}`);
    products.push(product);
  }

  return products;
}
