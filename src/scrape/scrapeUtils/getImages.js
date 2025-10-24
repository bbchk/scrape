import CyrillicToTranslit from "cyrillic-to-translit-js";

import fs from "fs";
import { mkdir } from "fs/promises";

import * as path from "path";

import { fileURLToPath } from "url";
import { dirname } from "path";
import { flash, red, terminator } from "../../globals/variables.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function getImages(page, product, imagesUrls, brand) {
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
        { timeout: 5000 }
      );

      await page.goto(imageUrl, {
        waitUntil: "networkidle2",
      });

      const response = await responsePromise;

      await saveImageFile(response, folderName, fileName);
      imagesPaths.push(
        `https://storage.googleapis.com/live_world/${folderName}/${fileName}`
      );
    }
  } catch (e) {
    console.log(`${red}${e.message}\n${flash}`);
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
