import { flash, red } from "../../globals/variables.js";

export async function getPrice(page) {
  let price = 0;
  try {
    const priceHandler = await page.$("p.product-price__big");
    const priceString = await page.evaluate(
      (el) => el.textContent,
      priceHandler
    );
    price = Number.parseInt(priceString.slice(0, -1));
  } catch (e) {
    console.log(`${red}price is not found\n${flash}`);
  }
  return price;
}
