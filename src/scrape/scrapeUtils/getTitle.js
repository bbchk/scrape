import { flash, red } from "../../globals/variables.js";

export async function getTitle(page) {
  let title = "";
  try {
    const heading = await page.$(
      "h1.product__title-left.product__title-collapsed.ng-star-inserted"
    );
    title = await page.evaluate((el) => el.textContent, heading);
  } catch (e) {
    console.log(`${red}title is not found\n${flash}`);
  }
  return title;
}
