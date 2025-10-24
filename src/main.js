import { init } from "./globals/init.js";
import { getProductLandingUrls } from "./search/search.js";
import { writeToFile } from "./io/writeToFile.js";
import { readJson, readTxtLinesToArray } from "./io/readFile.js";
import { scrapeSearch } from "./scrape/scrape.js";
import * as fs from "fs";

export async function scrape(brand) {
  const { browser, page } = await init("https://rozetka.com.ua/ua/");

  let productsInfo = null;
  const infoFilePath = `info/${brand}.json`;
  try {
    fs.accessSync(infoFilePath, fs.constants.F_OK);
    productsInfo = await readJson(infoFilePath);
  } catch (err) {
    console.log("productsInfo not Found");
    const entries = await readTxtLinesToArray(`entries/${brand}.txt`);

    const info = await getProductLandingUrls(page, entries);
    console.log(info);

    const { foundEntries, notFoundEntries } = info;
    productsInfo = info.productsInfo;

    await writeToFile(
      foundEntries + "\n\n" + notFoundEntries,
      `notFound/${brand}.txt`
    );
    await writeToFile(JSON.stringify(productsInfo, null, 2), infoFilePath);
  }

  let productsData = null;
  const dataFilePath = `data/${brand}.json`;
  try {
    fs.accessSync(dataFilePath, fs.constants.F_OK);
    productsData = await readJson(dataFilePath);
  } catch (err) {
    console.log("data not Found");
    const productsData = await scrapeSearch(page, productsInfo, brand);
    await writeToFile(JSON.stringify(productsData, null, 2), dataFilePath);
  }

  await browser.close();
  return productsData;
}

const toScrape = [
  "aleana",
  "garden-club",
  "greenharvest",
  "household_malceva",
  "kiloma_service",
  "kisson",
  "level_xoztovaru",
  "olkar",
  "partner(aleana)",
  "prof_nasinna",
  "recordagro-b",
  "spektr-agro",
  "ukravit",
  "vinxozgroup",
  "bazar-luyba",
  "animall",
  "royal-canin",
  "collar",
  "pan-kitpan-pes",
  "wiskas",
  "josera",
  "product",
  "krug_semenko",
  "pruroda",
  "myav-4paws-openmeal",
  "purina-friskies",
];

for (const brand of toScrape) {
  await scrape(brand);
}
