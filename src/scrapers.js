import path from "path";
import CyrillicToTranslit from "cyrillic-to-translit-js";
import * as crypto from "crypto"; // <-- ADD THIS IMPORT
import fs from "fs";

async function getName(element, selector) {
  const name = await element.$(selector);

  return await global._scrape.page
    .evaluate((el) => el.textContent, name)
    .catch((e) => console.log(`name is not found\n`));
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

async function getImages(elem) {
  const imagesPaths = [];

  const mainImageSelector =
    ".cs-product-image__main-img img.cs-product-image__img";

  try {
    await elem.waitForSelector(mainImageSelector, { timeout: 10000 });

    const imageElem = await elem.$(mainImageSelector);
    console.log(imageElem);

    const imageUrl = await global._scrape.page.evaluate(
      (img) => img.src,
      imageElem,
    );

    if (!imageUrl) {
      console.log("Image URL not found on the page.");
      return imagesPaths;
    }

    const extension = imageUrl.split(".").pop().split(/[?#]/)[0]; // robust extension extraction
    const randomId = crypto.randomBytes(8).toString("hex"); // Creates a unique 16-character hex string
    const finalFileName = `${randomId}.${extension}`; // e.g., "a3b4c5d6e7f8g9h0.jpg"

    // Go to the image URL to trigger the response
    await global._scrape.page.goto(imageUrl, {
      waitUntil: "domcontentloaded", // Changed to domcontentloaded for faster load
    });

    // Wait for the response to the image request
    const response = await global._scrape.page.waitForResponse(
      (res) => res.url() === imageUrl,
      { timeout: 5000 },
    );

    await saveImageFile(response, folderName, finalFileName);

    imagesPaths.push(`${folderName}/${finalFileName}`);
  } catch (e) {
    console.error(`Error scraping or saving image: ${e.message}`);
  }

  // Remember to navigate back to the product page after downloading!
  await global._scrape.page.goBack({ waitUntil: "domcontentloaded" });

  return imagesPaths;
}

async function saveImageFile(buffer, folderName, fileName) {
    const filePath = path.resolve(folderName, fileName);

    if (!fs.existsSync(path.dirname(filePath))) {
        await mkdir(path.dirname(filePath), { recursive: true });
    }
    fs.writeFileSync(filePath, buffer, "binary"); 
}
// async function getDescription() {
//   let text = "";
//   try {
//     const descriptionHandle = await page.$(
//       "div.product-about__description-content.text",
//     );
//     text = await page.evaluate((el) => el.innerHTML, descriptionHandle);
//   } catch (e) {
//     console.log(`description is not found\n$`);
//   }
//
//   return { Опис: text };
// }

export default { getName, getCharacteristics, getImages };
