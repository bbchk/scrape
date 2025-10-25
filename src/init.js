import puppeteer from "puppeteer-extra";

import StealthPlugin from "puppeteer-extra-plugin-stealth";
puppeteer.use(StealthPlugin());

import { randomUserAgent } from "./utils/randomUserAgent.js";

// ------------------------------------------

export async function init() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    executablePath: "/usr/bin/google-chrome-stable",
    userDataDir: "/home/bchk/.config/google-chrome/Default",
  });

  // TODO: chain
  const page = await browser.newPage();
  await page.setUserAgent(randomUserAgent);
  await page.goto("https://akb-st.com.ua/ua/product_list", {
    waitUntil: "domcontentloaded",
  });
  await page.setCacheEnabled(false);

  return { browser, page };
}
