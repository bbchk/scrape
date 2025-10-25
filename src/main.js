import { init } from "./init.js";

import { landingLinks } from "./cfg.js";

import CyrillicToTranslit from "cyrillic-to-translit-js";
import { randomUserAgent } from "./utils/randomUserAgent.js";
import scrapers from "./scrapers.js";

import { mkdir } from "fs/promises";

import * as path from "path";

import { fileURLToPath } from "url";
import { dirname } from "path";

import { writeToFile } from "./utils/writeToFile.js";
// import { readJson, readTxtLinesToArray } from "./utils/readFile.js";

import * as fs from "fs";

const URLS = [
  "https://akb-st.com.ua/ua/g112248703-eurocraft-monbatbolgariya",
  "https://akb-st.com.ua/ua/g112248703-eurocraft-monbatbolgariya/page_2",
  "https://akb-st.com.ua/ua/g112248703-eurocraft-monbatbolgariya/page_3",
  "https://akb-st.com.ua/ua/g112248703-eurocraft-monbatbolgariya/page_4",
  "https://akb-st.com.ua/ua/g89470512-kainar-kazahstan",
  "https://akb-st.com.ua/ua/g89470512-kainar-kazahstan/page_2",
  "https://akb-st.com.ua/ua/g89470512-kainar-kazahstan/page_3",
];

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

  for (const u of URLS) {
    const links = await loop(u);
    await writeToFile(
      JSON.stringify(links),
      `links_from_${path.basename(u)}.json`,
    );
  }

  await browser.close();

  async function loop(url) {
    // console.log(url);
    const imagesUrls = new Set();
    page.on("response", (res) => {
      const resType = res.request().resourceType();
      const resUrl = res.url();

      if (resType == "image" && resUrl.match(/akum|bat/gi)) {
        imagesUrls.add(res.url());
      }
    });

    await page.setUserAgent(randomUserAgent);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
    });

    const products = [];

    // const productCards = await page.$$(
    //   `${selectors.listing.content} ${selectors.listing.row} ${selectors.listing.gallery} ${selectors.listing.galleryItem}`,
    // );

    const { cards, links } = await scrapers.collectLandingLinks(
      page,
      selectors.listing.galleryItem,
      selectors.listing.galleryItemLink,
    );

    console.log(links);

    // await page.waitForSelector(selectors.listing.galleryItem, {
    //   timeout: 100000,
    // });
    // const productCards = await page.$$(
    //   selectors.listing.galleryItem, // Try just "li.cs-product-gallery__item"
    // );
    // console.log(productCards);
    // for (const p of productCards) {
    //   const productLink = await p.$(selectors.listing.galleryItemLink);
    //   const productLandingUrl = await page.evaluate(
    //     (el) => el.href,
    //     productLink,
    //   );
    //
    //   await page.goto(productLandingUrl, { waitUntil: "domcontentloaded" });
    //
    //   products.push({
    //     name: await scrapers.getName(page, selectors.landing.name),
    //     // description: await getDescription(),
    //     // characteristics: await getCharacteristics(),
    //     // images: await getImages(),
    //   });
    //
    //   await page.goBack({ waitUntil: "domcontentloaded" });
    // }

    return links;
  }
}

main();


