
async function getName(element, selector) {
  const name = await element.$(selector);

  return await global._scrape.page
    .evaluate((el) => el.textContent, name)
    .catch((e) => console.log(`name is not found\n`));
}

export default { getName, collectLandingLinks };

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
//
// async function getCharacteristics() {
//   const characteristics = {};
//   try {
//     const characteristicsItems = await page.$$(
//       "dl.characteristics-full__list div.characteristics-full__item.ng-star-inserted",
//     );
//
//     for (const item of characteristicsItems) {
//       const labelHandle = await item.$("dt.characteristics-full__label span");
//       const lableText = await page.evaluate(
//         (el) => el.textContent,
//         labelHandle,
//       );
//       const valueHandle = await item.$(
//         "dd.characteristics-full__value ul.characteristics-full__sub-list li.ng-star-inserted",
//       );
//       const valueContent = await page.evaluate(
//         (el) => el.textContent,
//         valueHandle,
//       );
//       characteristics[lableText] = valueContent;
//     }
//   } catch (e) {
//     console.log(`${e.message}\n`);
//     console.log(e.stack);
//   }
//   return characteristics;
// }

// async function getImages(page, product, imagesUrls, brand) {
//   let { folderName, fileName } = getImagePath(product);
//
//   const imagesPaths = [];
//   try {
//     const imagesUrlsArray = Array.from(imagesUrls);
//
//     for (let index = 0; index < imagesUrlsArray.length; index++) {
//       const imageUrl = imagesUrlsArray[index];
//
//       const extension = imageUrl.split(".").pop();
//       fileName = `${fileName}_${index}.${extension}`;
//
//       const responsePromise = page.waitForResponse(
//         (response) => response.url() === imageUrl,
//         { timeout: 5000 },
//       );
//
//       await page.goto(imageUrl, {
//         waitUntil: "networkidle2",
//       });
//
//       const response = await responsePromise;
//
//       await saveImageFile(response, folderName, fileName);
//       imagesPaths.push(
//         `https://storage.googleapis.com/live_world/${folderName}/${fileName}`,
//       );
//     }
//   } catch (e) {
//     console.log(e.stack);
//   }
//   return imagesPaths;
// }
//
// function getImagePath(product) {
//   let folderName = `images/${product.brand}_images`
//     .toLowerCase()
//     .split(" ")
//     .join("_");
//
//   const cyrillicToTranslit = new CyrillicToTranslit();
//   let fileName = cyrillicToTranslit
//     .transform(product.entry)
//     .toLowerCase()
//     .split(" ")
//     .join("_")
//     .replaceAll('"', "")
//     .replaceAll("*", "_")
//     .replaceAll("'", "");
//
//   return { folderName, fileName };
// }
//
// async function saveImageFile(response, folderName, fileName) {
//   const buffer = await response.buffer();
//   const filePath = path.resolve(folderName, fileName);
//   // const filePath = path.resolve(__dirname, "..", folderName, fileName);
//
//   if (!fs.existsSync(path.dirname(filePath))) {
//     await mkdir(path.dirname(filePath), { recursive: true });
//   }
//   fs.writeFileSync(filePath, buffer, "binary");
// }
