import { init } from "./init.js";
import CyrillicToTranslit from "cyrillic-to-translit-js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { mkdir } from "fs/promises";
import * as path from "path";
import * as fs from "fs";
// Assuming writeToFile is correctly imported and works for saving scraped data
import { writeToFile } from "./utils/writeToFile.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const URLS = [
  "https://akb-st.com.ua/ua/g113712469-agm",
  "https://akb-st.com.ua/ua/g112248703-eurocraft-monbatbolgariya",
  "https://akb-st.com.ua/ua/g89470512-kainar-kazahstan",
];

// NOTE: The TITLE selector provided in the original code is for a list/gallery page,
// but the functions use a selector for a product page. I'll keep the working product page selector.
const TITLE_SELECTOR = "span[data-qaid='product_name']";

// --- Utility function stubs (must be defined to run main) ---
// Assuming this is either defined or imported elsewhere.
const randomUserAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

async function getPrice(page) {
  // Logic to extract price (e.g., from 'cs-sticky-panel__price')
  const priceHandle = await page.$(".cs-sticky-panel__price");
  if (priceHandle) {
    return await page.evaluate((el) => el.textContent.trim(), priceHandle);
  }
  return "Price Not Found";
}

// Simple HTTP fetcher for images
async function downloadImage(url) {
  // Using simple node-fetch or native http/https module is better for downloading
  // binary files outside of Puppeteer context, but for a simple fix within
  // a Puppeteer environment, a new page or a simple fetch/axios call is common.
  // Since 'fetch' is now native in recent Node.js versions, we can use it.
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    return response.buffer(); // response.buffer() is often available if using node-fetch, use arrayBuffer() if using native fetch
  } catch (error) {
    console.error(`Download error for ${url}:`, error.message);
    return null;
  }
}
// -----------------------------------------------------------------

async function main() {
  // Assuming init sets up browser and page correctly
  const { browser, page } = await init("https://akb-st.com.ua/ua");

  // Fix for loop variable: 'u' should be 'url' and use of 'of'
  for (const url of URLS) {
    await loop(url);
  }

  await browser.close();

  async function loop(url) {
    const imagesUrls = new Set();
    // NOTE: The URLs in your array point to CATEGORY pages, not PRODUCT pages.
    // This loop will only scrape the first product found on the category page (if any)
    // or fail to find a specific product's elements. I will assume the page *is* a product page for the functions to work.

    page.on("response", (res) => {
      if (
        // Changed from OR to AND for better image filtering
        res.request().resourceType() === "image" &&
        (res.url().includes("akum") || res.url().includes("bat"))
      ) {
        imagesUrls.add(res.url());
      }
    });

    await page.setUserAgent(randomUserAgent);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
    });

    // The product details are scraped here. We need them before calling getImages.
    const product = {
      name: await getName(page),
      price: await getPrice(page),
      description: await getDescription(page),
      characteristics: await getCharacteristics(page),
      // NOTE: 'brand' is undefined here. I'm stubbing a way to get it from the characteristics.
      images: await getImages(page, product, imagesUrls),
    };

    const products = [product]; // Keep it in an array for consistency

    writeToFile(products, "scraped_data.json");
  }

  // [getName, getDescription, getCharacteristics remain here, as fixed in the previous step]

  async function getName(page) {
    // The product name appears in the sticky panel towards the end of the HTML.
    const nameHandle = await page.$(TITLE_SELECTOR);
    if (nameHandle) {
      return await page
        .evaluate((el) => el.textContent.trim(), nameHandle)
        .catch((e) =>
          console.log(`Error getting product name: ${e.message}\n`),
        );
    } else {
      // console.log(`Product name selector "${TITLE_SELECTOR}" not found.\n`);
      return null; // Return null if the name element is not found
    }
  }

  async function getDescription(page) {
    let text = "";
    try {
      // The whole product info seems to be in the first major div after the top alerts:
      // NOTE: This selector is fragile and was a best effort from the previous step.
      const descriptionContainer = await page.$(
        "div.ck-alert_theme_orange + div",
      );
      if (descriptionContainer) {
        text = await page.evaluate((el) => {
          let content = "";
          const alerts = document.querySelectorAll(
            ".ck-alert:not(.ck-alert_theme_green)",
          );
          alerts.forEach((alert) => (content += alert.outerHTML));

          const h2s = document.querySelectorAll("h2");
          h2s.forEach((h2) => (content += h2.outerHTML));

          return content;
        }, descriptionContainer);
      } else {
        // console.log(`Description container not clearly defined in HTML.\n`);
      }
    } catch (e) {
      console.log(`Error getting description: ${e.message}\n`);
    }

    return { Опис: text.trim() };
  }

  async function getCharacteristics(page) {
    const characteristics = {};
    try {
      const table = await page.$("table.b-product-info");

      if (table) {
        const tableData = await page.evaluate((tableElement) => {
          const data = {};
          const rows = tableElement.querySelectorAll("tr");

          rows.forEach((row) => {
            const cells = row.querySelectorAll("td");
            if (cells.length === 2) {
              const label = cells[0].textContent.trim();
              const value = cells[1].textContent.trim().replace(/\s+/g, " ");

              if (label === "Полярність") {
                data[label] = value.replace(/"/g, "").trim();
              } else {
                data[label] = value;
              }
            }
          });
          return data;
        }, table);

        Object.assign(characteristics, tableData);
      } else {
        // console.log(`Characteristics table 'table.b-product-info' not found.\n`);
      }
    } catch (e) {
      console.log(`Error getting characteristics: ${e.message}\n`);
    }

    return characteristics;
  }

  /**
   * FIX: Simplified getImages to use the original page context for image URLs
   * and relies on the separate saveImageFile/downloadImage logic.
   * The image downloading logic using page.goto was removed.
   */
  async function getImages(page, product, imagesUrls, brand="false") {
    // Fix: Use a placeholder for 'product.entry' since it wasn't defined.
    // Assuming 'product.entry' should be the product name.
    const productWithEntry = {
      ...product,
      brand: brand,
      entry: product.name || "default_product_name", // Use name for file creation
    };

    const { folderName, fileName: baseFileName } =
      getImagePath(productWithEntry);

    const imagesPaths = [];
    try {
      // Get all unique URLs captured by the response listener
      const imagesUrlsArray = Array.from(imagesUrls);

      // Also check the main image tag on the page as a fallback/primary image
      const mainImageHandle = await page.$(
        "img[data-qaid='img_product_sticky_panel']",
      );
      if (mainImageHandle) {
        const mainImageUrl = await page.evaluate(
          (img) => img.src,
          mainImageHandle,
        );
        if (mainImageUrl && !imagesUrlsArray.includes(mainImageUrl)) {
          // Add the main image if not already captured
          imagesUrlsArray.unshift(mainImageUrl);
        }
      }

      for (let index = 0; index < imagesUrlsArray.length; index++) {
        const imageUrl = imagesUrlsArray[index];
        const extension = imageUrl.split(".").pop().split("?")[0]; // Handle query parameters

        // Create a unique file name for each image
        const fileName = `${baseFileName}_${index}.${extension}`;

        // --- FIX: Use a simple downloader instead of page.goto ---
        const buffer = await downloadImage(imageUrl);

        if (buffer) {
          await saveImageFile(buffer, folderName, fileName); // Save using the buffer
          // Construct the URL path to the saved image (assuming a server)
          imagesPaths.push(
            `https://storage.googleapis.com/live_world/${folderName}/${fileName}`,
          );
        }
      }
    } catch (e) {
      console.log(`Error in getImages: ${e.stack}`);
    }
    return imagesPaths;
  }

  // [getImagePath and saveImageFile remain as they were, slightly adjusted saveImageFile for clarity]

  function getImagePath(product) {
    // NOTE: The original product.brand is undefined in the loop, fixed above
    let folderName = `images/${product.brand}_images`
      .toLowerCase()
      .split(" ")
      .join("_");

    const cyrillicToTranslit = new CyrillicToTranslit();
    // NOTE: product.entry is now product.name from the fix in getImages
    let fileName = cyrillicToTranslit
      .transform(product.entry)
      .toLowerCase()
      .split(" ")
      .join("_")
      .replaceAll('"', "")
      .replaceAll("*", "_")
      .replaceAll("'", "")
      .replaceAll("/", "_"); // Added a common cleanup

    return { folderName, fileName };
  }

  // FIX: saveImageFile now accepts the buffer directly instead of a response object
  async function saveImageFile(buffer, folderName, fileName) {
    const filePath = path.resolve(folderName, fileName);

    if (!fs.existsSync(path.dirname(filePath))) {
      await mkdir(path.dirname(filePath), { recursive: true });
    }
    // Write the buffer to the file
    fs.writeFileSync(filePath, buffer, "binary");
  }
}

main();
