import { init } from "./init.js";
import { randomUserAgent } from "./utils/randomUserAgent.js";
import scrapers from "./scrapers.js";
import * as path from "path";
import { writeToFile } from "./utils/writeToFile.js";

const LISTING_URLS = [
  "https://akb-st.com.ua/ua/g112248703-eurocraft-monbatbolgariya",
  "https://akb-st.com.ua/ua/g112248703-eurocraft-monbatbolgariya/page_2",
  "https://akb-st.com.ua/ua/g112248703-eurocraft-monbatbolgariya/page_3",
  "https://akb-st.com.ua/ua/g112248703-eurocraft-monbatbolgariya/page_4",
  "https://akb-st.com.ua/ua/g89470512-kainar-kazahstan",
  "https://akb-st.com.ua/ua/g89470512-kainar-kazahstan/page_2",
  "https://akb-st.com.ua/ua/g89470512-kainar-kazahstan/page_3",
];

async function main() {
  const { browser, page } = await init("https://akb-st.com.ua/ua");
  global._scrape = {
    browser,
    page,
  };
  await page.setUserAgent(randomUserAgent);
  await page.goto(url, {
    waitUntil: "domcontentloaded",
  });

  for (const u of LISTING_URLS) {
    const { cards, links } = await collectLandingLinks(
      page,
      selectors.listing.galleryItem,
      selectors.listing.galleryItemLink,
    );
    await writeToFile(
      JSON.stringify(links),
      `links_from_${path.basename(u)}.json`,
    );
  }

  await browser.close();
}

async function collectLandingLinks(elem, selectors, linkSelector) {
  let productCards = [];
  const links = [];

  for (const s of selectors) {
    try {
      await elem.waitForSelector(s, { timeout: 5000 });
      productCards = await elem.$$(s);
      // console.log(productCards)

      if (productCards.length > 0) {
        for (const s of productCards) {
          const l = await s.$(linkSelector);
          const url = await global._scrape.page.evaluate((el) => el.href, l);
          // console.log(url);
          links.push(url);
        }
        break;
      }
    } catch (error) {
      if (error.name === "TimeoutError") {
        console.log(
          `Selector failed to load within timeout: ${s}. Trying next one.`,
        );
      } else {
        console.log(`Error during selection for ${s}: ${error.message}`);
      }
    }
  }

  return { productCards, links };
}
