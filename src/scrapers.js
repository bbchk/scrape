import path from "path";
import CyrillicToTranslit from "cyrillic-to-translit-js";
import * as crypto from "crypto"; // <-- ADD THIS IMPORT
import fs from "fs";
import { mkdir } from "fs/promises"; // Assuming 'mkdir' is availabl

import { promises as fsPromises } from "fs";
import fetch from "node-fetch"; // Or use global fetch if available

async function getName(element, selector) {
  const nameEl = await element.$(selector);

  const name = await global._scrape.page
    .evaluate((el) => el.textContent, nameEl)
    .catch((e) => console.log(`name is not found\n`));

  global._scrape.name = name;
  return name;
}

async function getCharacteristics(elem) {
  const characteristics = {};
  try {
    const tableRows = await elem.$$(
      "div.cs-tab-list table.b-product-info tbody tr",
    );

    for (const row of tableRows) {
      // Find the header cells (<th>) which separate sections (e.g., "Основні").
      // We skip these rows as they don't contain key/value pairs we want to scrape.
      const headerCell = await row.$("th.b-product-info__header");
      if (headerCell) {
        continue;
      }

      // 2. Select the key (label) cell, which is the first <td> in the row.
      const labelHandle = await row.$("td.b-product-info__cell:nth-child(1)");

      // 3. Select the value cell, which is the second <td> in the row.
      const valueHandle = await row.$("td.b-product-info__cell:nth-child(2)");

      // Ensure both key and value elements are found
      if (labelHandle && valueHandle) {
        // Extract text content, stripping leading/trailing whitespace
        const labelText = await global._scrape.page.evaluate(
          (el) => el.textContent.trim(),
          labelHandle,
        );
        const valueContent = await global._scrape.page.evaluate(
          (el) => el.textContent.trim(),
          valueHandle,
        );

        if (labelText) {
          characteristics[labelText] = valueContent;
        }
      }
    }
  } catch (e) {
    console.error(`Error scraping characteristics: ${e.message}\n`, e.stack);
  }
  return characteristics;
}

const mainImageSelector =
  ".cs-product-image__main-img img.cs-product-image__img";

async function getImages(elem) {
  const imagesPaths = [];

  try {
    // Wait for the image element
    await elem.waitForSelector(mainImageSelector, { timeout: 10000 });
    const imageElem = await elem.$(mainImageSelector);

    // Get the image URL
    const imageUrl = await global._scrape.page.evaluate(
      (img) => (img ? img.src : null),
      imageElem,
    );

    if (!imageUrl) {
      console.log("Image URL not found on the page.");
      return imagesPaths;
    }

    // You might need a more robust URL parsing for extension
    // Ensure you use the crypto.webcrypto if running in a browser-like environment
    const extension = imageUrl.split(".").pop().split(/[?#]/)[0];
