// import { getCategory } from "./scrapeUtils/getCategory.js";
import { getCharacteristics } from "./scrapeUtils/getCharacteristics.js";
import { getDescription } from "./scrapeUtils/getDescription.js";
import { getImages } from "./scrapeUtils/getImages.js";
import { getPrice } from "./scrapeUtils/getPrice.js";
import { getTitle } from "./scrapeUtils/getTitle.js";
import { getRandomUserAgent } from "../globals/randomUserAgent.js";
import { flash, red, terminator } from "../globals/variables.js";

export async function scrapeSearch(page, productsInfo, brand) {
  const products = [];
  
  for (let i = 0; i < productsInfo.length; i++) {
    const { entry, url } = productsInfo[i];
    console.log(`Processing ${i + 1}/${productsInfo.length}: ${entry}`);
    
    try {
      const imagesUrls = new Set();
      const imageListener = (res) => {
        if (
          res.request().resourceType() === "image" &&
          res.url().includes("/goods/images/big")
        ) {
          imagesUrls.add(res.url());
        }
      };
      
      page.on("response", imageListener);

      // Enhanced delay between requests
      const delay = Math.random() * 3000 + 2000; // 2-5 seconds
      await new Promise(resolve => setTimeout(resolve, delay));

      // Rotate user agent for each product
      await page.setUserAgent(getRandomUserAgent());
      
      // Simulate human-like navigation
      await simulateHumanNavigation(page);
      
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 30000
      });

      // Random scroll and interaction simulation
      await simulatePageInteraction(page);

      const product = { entry: entry, left: 0, brand: brand };

      // Add error handling for each scraping function
      try {
        product.name = await getTitle(page);
      } catch (e) {
        console.warn(`Failed to get title for ${entry}: ${e.message}`);
        product.name = null;
      }

      try {
        product.price = await getPrice(page);
      } catch (e) {
        console.warn(`Failed to get price for ${entry}: ${e.message}`);
        product.price = null;
      }

      try {
        product.description = await getDescription(page);
      } catch (e) {
        console.warn(`Failed to get description for ${entry}: ${e.message}`);
        product.description = null;
      }

      try {
        product.characteristics = await getCharacteristics(page);
      } catch (e) {
        console.warn(`Failed to get characteristics for ${entry}: ${e.message}`);
        product.characteristics = null;
      }

      try {
        product.images = await getImages(page, product, imagesUrls, brand);
      } catch (e) {
        console.warn(`Failed to get images for ${entry}: ${e.message}`);
        product.images = [];
      }

      console.log(product, `\n${terminator}`);
      products.push(product);
      
      // Remove the event listener to prevent memory leaks
      page.removeListener("response", imageListener);

    } catch (error) {
      console.error(`Error processing ${entry}: ${error.message}`);
      // Add the failed product with null values
      products.push({
        entry: entry,
        left: 0,
        brand: brand,
        name: null,
        price: null,
        description: null,
        characteristics: null,
        images: [],
        error: error.message
      });
    }
  }

  return products;
}

async function simulateHumanNavigation(page) {
  // Simulate typing in address bar (just mouse movement)
  const viewport = page.viewport();
  await page.mouse.move(viewport.width / 2, 50, { steps: 10 });
  await new Promise(r => setTimeout(r, Math.random() * 200 + 100));
}

async function simulatePageInteraction(page) {
  try {
    // Random scroll simulation
    const scrollCount = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < scrollCount; i++) {
      const scrollY = Math.random() * 300 + 100;
      await page.evaluate((y) => window.scrollBy(0, y), scrollY);
      await new Promise(r => setTimeout(r, Math.random() * 800 + 300));
    }
    
    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, Math.random() * 500 + 200));
    
    // Random mouse movements
    const viewport = page.viewport();
    for (let i = 0; i < 3; i++) {
      const x = Math.random() * viewport.width;
      const y = Math.random() * viewport.height;
      await page.mouse.move(x, y, { steps: Math.floor(Math.random() * 15) + 5 });
      await new Promise(r => setTimeout(r, Math.random() * 300 + 100));
    }
  } catch (error) {
    // Ignore interaction errors
    console.warn(`Page interaction simulation failed: ${error.message}`);
  }
}
