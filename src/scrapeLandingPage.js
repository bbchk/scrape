import { init } from "./init.js";
import { landingLinks } from "./cfg.js";
import { randomUserAgent } from "./utils/randomUserAgent.js";
import scrapers from "./scrapers.js";
import * as path from "path";
import { writeToFile } from "./utils/writeToFile.js";

const selectors = {
  landing: {
    name: "div.cs-page__content-product-inner div.cs-product__info h1.cs-title.cs-title_type_product.cs-online-edit span[data-qaid='product_name']",
  },
  listing: {
    content: "div.cs-page__content",
    row: "div.cs-page__row:nth-of-type(2)",
    gallery: "ul.cs-product-gallery__list",

    galleryItem: [
      "li.cs-online-edit.cs-product-gallery__item.js-productad",
      "li.ProductList__item--d3K92.js-rtb-partner.js-productad",
    ],

    galleryItemLink: "a.cs-product-gallery__image-link",
  },
};

async function main() {
  const { browser, page } = await init("https://akb-st.com.ua/ua");
  global._scrape = {
    browser,
    page,
  };

  const products = [];
  for (const u of landingLinks) {
    console.log(u);
    products.push(await loop(u));
  }

  await writeToFile(JSON.stringify(products), `landing-scraped-result.json`);

  await browser.close();

  async function loop(url) {

    // const imagesUrls = new Set();
    // page.on("response", (res) => {
    //   const resType = res.request().resourceType();
    //   const resUrl = res.url();
    //   if (resType == "image" && resUrl.match(/akum|bat/i)) {
    //     imagesUrls.add(res.url());
    //   }
    // });

    await page.setUserAgent(randomUserAgent);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
    });

    const product = {
      name: await scrapers.getName(page, selectors.landing.name),
      // description: await scrapers.getDescription(page,),
      characteristics: await scrapers.getCharacteristics(page),
      images: await scrapers.getImages(page),
    };

    console.log(product);

    return product;
  }
}

main();
