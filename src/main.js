import { init } from "./globals/init.js";
import { getProductLandingUrls } from "./search/search.js";
import { writeToFile } from "./io/writeToFile.js";
import { readJson, readTxtLinesToArray } from "./io/readFile.js";
import { scrapeSearch } from "./scrape/scrape.js";
import { sessionManager } from "./globals/sessionManager.js";
import { retryManager } from "./globals/retryManager.js";
import * as fs from "fs";
import path from "path";

export async function scrape(brand) {
  console.log(`\n🚀 Starting scrape for brand: ${brand}`);

  let browser = null;
  let page = null;

  try {
    const initResult = await retryManager.executeWithRetry(
      () => init("https://akb-st.com.ua/ua/g89827870-star-standart"),

      { operation: "init" },
    );


    browser = initResult.browser;
    page = initResult.page;

    console.log(`✅ Browser initialized successfully`);

    await new Promise(resolve => setTimeout(resolve, 100));

    let productsInfo = null;
    const infoFilePath = `info/${brand}.json`;

    try {
      fs.accessSync(infoFilePath, fs.constants.F_OK);
      productsInfo = await readJson(infoFilePath);
      console.log(`📄 Loaded existing products info for ${brand}`);
    } catch (err) {
      console.log(
        `🔍 Products info not found, starting search for ${brand}...`,
      );
      const entries = await readTxtLinesToArray(
        `/home/bchk/dev/scrape/src/entries/${brand}.txt`,
      );
      console.log(`📝 Found ${entries.length} entries to search`);

      const info = await retryManager.executeWithRetry(
        () => getProductLandingUrls(page, entries),
        { operation: "search", brand },
      );

      console.log(`✅ Search completed:`, info);

      const { foundEntries, notFoundEntries } = info;
      productsInfo = info.productsInfo;

      // Ensure directories exist
      const notFoundDir = path.dirname(`notFound/${brand}.txt`);
      const infoDir = path.dirname(infoFilePath);

      if (!fs.existsSync(notFoundDir)) {
        fs.mkdirSync(notFoundDir, { recursive: true });
      }
      if (!fs.existsSync(infoDir)) {
        fs.mkdirSync(infoDir, { recursive: true });
      }

      await writeToFile(
        foundEntries + "\n\n" + notFoundEntries,
        `notFound/${brand}.txt`,
      );
      await writeToFile(JSON.stringify(productsInfo, null, 2), infoFilePath);
      console.log(`💾 Search results saved`);
    }

    let productsData = null;
    const dataFilePath = `data/${brand}.json`;

    try {
      fs.accessSync(dataFilePath, fs.constants.F_OK);
      productsData = await readJson(dataFilePath);
      console.log(`📄 Loaded existing scraped data for ${brand}`);
    } catch (err) {
      console.log(`🕷️ Starting detailed scraping for ${brand}...`);

      // Ensure data directory exists
      const dataDir = path.dirname(dataFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      productsData = await retryManager.executeWithRetry(
        () => scrapeSearch(page, productsInfo, brand),
        { operation: "scrape", brand },
      );

      await writeToFile(JSON.stringify(productsData, null, 2), dataFilePath);
      console.log(`💾 Scraped data saved for ${brand}`);
    }

    console.log(
      `✅ Completed scraping for ${brand}. Found ${productsData.length} products.`,
    );
    return productsData;
  } catch (error) {
    console.error(`❌ Fatal error scraping ${brand}:`, error.message);

    if (page) {
      await retryManager.handlePageError(page, error);
    }

    throw error;
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log(`🔒 Browser closed for ${brand}`);
      } catch (closeError) {
        console.warn(`Warning: Failed to close browser: ${closeError.message}`);
      }
    }
  }
}

async function main() {
  const toScrape = ["crona", "eurokraft", "istar", "kainar", "maximus"];
  const results = {};
  const errors = {};

  console.log(`🎯 Starting scraping process for ${toScrape.length} brands`);

  // Create debug directory
  if (!fs.existsSync("./debug")) {
    fs.mkdirSync("./debug", { recursive: true });
  }

  for (let i = 0; i < toScrape.length; i++) {
    const brand = toScrape[i];
    console.log(`\n📊 Progress: ${i + 1}/${toScrape.length} brands`);

    try {
      // Add delay between different brands
      if (i > 0) {
        const brandDelay = Math.random() * 10000 + 5000; // 5-15 seconds
        console.log(
          `⏳ Waiting ${Math.round(brandDelay / 1000)}s before next brand...`,
        );
        await new Promise((resolve) => setTimeout(resolve, brandDelay));
      }

      results[brand] = await scrape(brand);
    } catch (error) {
      console.error(`❌ Failed to scrape ${brand}:`, error.message);
      errors[brand] = error.message;
    }
  }

  // Print summary
  console.log("\n📋 SCRAPING SUMMARY");
  console.log("==================");
  console.log(`✅ Successful: ${Object.keys(results).length}`);
  console.log(`❌ Failed: ${Object.keys(errors).length}`);

  if (Object.keys(errors).length > 0) {
    console.log("\n❌ Errors:");
    Object.entries(errors).forEach(([brand, error]) => {
      console.log(`  ${brand}: ${error}`);
    });
  }

  const retryStats = retryManager.getStats();
  if (retryStats.failedCount > 0) {
    console.log(
      `\n⚠️  ${retryStats.failedCount} URLs marked as permanently failed`,
    );
  }

  console.log("\n🎉 Scraping process completed!");
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
