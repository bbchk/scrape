import { init } from "./init.js";

import CyrillicToTranslit from "cyrillic-to-translit-js";

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
    title: "h1.product__title-left.product__title-collapsed.ng-star-inserted",
  },
  listing: {
    gallery: "ul.cs-product-gallery__list",
    galleryItem: "li.cs-product-gallery__item",
  },
};

async function main() {
  const { browser, page } = await init("https://akb-st.com.ua/ua");

  for (u in URLS) {
    loop(u);
  }

  await browser.close();

  async function loop(url) {
    const imagesUrls = new Set();

    page.on("response", (res) => {
      if (
        (res.request().resourceType() == "image" &&
          res.url().includes("akum")) ||
        res.url().includes("bat")
      ) {
        imagesUrls.add(res.url());
      }
    });

// const paragraph = "The quick brown fox jumps over the lazy dog. It barked.";
// const regex = /[A-Z]/g;
// const found = paragraph.match(regex);

    await page.setUserAgent(randomUserAgent);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
    });

    const products = [];
    products.push({
      name: await getName(),
      price: await getPrice(),
      description: await getDescription(),
      characteristics: await getCharacteristics(),
      images: await getImages(),
    });
  }

  async function getName() {
    const name = await page.$(TITLE);
    return await page
      .evaluate((el) => el.textContent, name)
      .catch((e) => console.log(`title is not found\n`));
  }

  async function getDescription() {
    let text = "";
    try {
      const descriptionHandle = await page.$(
        "div.product-about__description-content.text",
      );
      text = await page.evaluate((el) => el.innerHTML, descriptionHandle);
    } catch (e) {
      console.log(`description is not found\n$`);
    }

    return { Опис: text };
  }

  async function getCharacteristics() {
    const characteristics = {};
    try {
      const characteristicsItems = await page.$$(
        "dl.characteristics-full__list div.characteristics-full__item.ng-star-inserted",
      );

      for (const item of characteristicsItems) {
        const labelHandle = await item.$("dt.characteristics-full__label span");
        const lableText = await page.evaluate(
          (el) => el.textContent,
          labelHandle,
        );
        const valueHandle = await item.$(
          "dd.characteristics-full__value ul.characteristics-full__sub-list li.ng-star-inserted",
        );
        const valueContent = await page.evaluate(
          (el) => el.textContent,
          valueHandle,
        );
        characteristics[lableText] = valueContent;
      }
    } catch (e) {
      console.log(`${e.message}\n`);
      console.log(e.stack);
    }
    return characteristics;
  }

  async function getImages(page, product, imagesUrls, brand) {
    let { folderName, fileName } = getImagePath(product);

    const imagesPaths = [];
    try {
      const imagesUrlsArray = Array.from(imagesUrls);

      for (let index = 0; index < imagesUrlsArray.length; index++) {
        const imageUrl = imagesUrlsArray[index];

        const extension = imageUrl.split(".").pop();
        fileName = `${fileName}_${index}.${extension}`;

        const responsePromise = page.waitForResponse(
          (response) => response.url() === imageUrl,
          { timeout: 5000 },
        );

        await page.goto(imageUrl, {
          waitUntil: "networkidle2",
        });

        const response = await responsePromise;

        await saveImageFile(response, folderName, fileName);
        imagesPaths.push(
          `https://storage.googleapis.com/live_world/${folderName}/${fileName}`,
        );
      }
    } catch (e) {
      console.log(e.stack);
    }
    return imagesPaths;
  }

  function getImagePath(product) {
    let folderName = `images/${product.brand}_images`
      .toLowerCase()
      .split(" ")
      .join("_");

    const cyrillicToTranslit = new CyrillicToTranslit();
    let fileName = cyrillicToTranslit
      .transform(product.entry)
      .toLowerCase()
      .split(" ")
      .join("_")
      .replaceAll('"', "")
      .replaceAll("*", "_")
      .replaceAll("'", "");

    return { folderName, fileName };
  }

  async function saveImageFile(response, folderName, fileName) {
    const buffer = await response.buffer();
    const filePath = path.resolve(folderName, fileName);
    // const filePath = path.resolve(__dirname, "..", folderName, fileName);

    if (!fs.existsSync(path.dirname(filePath))) {
      await mkdir(path.dirname(filePath), { recursive: true });
    }
    fs.writeFileSync(filePath, buffer, "binary");
  }
}

main();
