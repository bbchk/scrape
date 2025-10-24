import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
puppeteer.use(StealthPlugin());

import { randomUserAgent } from "./randomUserAgent.js";

export const START_URL = "https://rozetka.com.ua/ua/";

export async function init(startUrl) {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    userDataDir: "./tmp",
    executablePath: "google-chrome-stable",
    userDataDir: "/home/bchk/.config/google-chrome/Default",
  });

  const page = await browser.newPage();
  await page.setUserAgent(randomUserAgent);
  await page.goto(startUrl, {
    waitUntil: "domcontentloaded",
  });

  await page.setCacheEnabled(false);

  return { browser, page };
}
