import { searchFor } from "./searchFor.js";

export async function getProductLandingUrls(page, searchEntries) {
  let productsInfo = [];
  let notFoundEntries = ``;
  let foundEntries = ``;

  if (!Array.isArray(searchEntries)) {
    searchEntries = searchEntries.split("\n");
  }
  for (const entry of searchEntries) {
    const product = await searchFor(page, entry);
    if (product.url == null) {
      notFoundEntries += `${entry}\n`;
    } else {
      foundEntries += `${entry}\n`;
      productsInfo.push(product);
    }
  }
  return { foundEntries, notFoundEntries, productsInfo };
}
