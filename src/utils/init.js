import puppeteer from "puppeteer-extra";

import StealthPlugin from "puppeteer-extra-plugin-stealth";
puppeteer.use(StealthPlugin());

import { randomUserAgent } from "./utils/randomUserAgent.js";
import cfg from "./cfg.js";

// ------------------------------------------

export async function init() {
  const browser = await puppeteer.launch({
    headless: cfg.headless,
    defaultViewport: null,
    executablePath: cfg.executablePath,
    userDataDir: cfg.userDataDir,
  });

  // TODO: chain
  const page = await browser.newPage();
  await page.setUserAgent(randomUserAgent);
  await page.goto(cfg.startUrl, { waitUntil: "domcontentloaded" });
  await page.setCacheEnabled(false);

  return { browser, page };
}
