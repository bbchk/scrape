import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { readJson } from "../../io/readFile.js";
import { isCancel } from "axios";

puppeteer.use(StealthPlugin());

const CATEGORIES_INTERFACE = await readJson("./categories.json");
const ALL_CATEGORIES = await readJson("./test.categories.json");

export async function getCategory(page, product) {
  let categoriesArray = null;

  try {
    const categoryString = await scrapeCategoryString(page);
    // console.log(categoryString);

    categoriesArray = findCategories(categoryString, product);
    categoriesArray = pasteIds(categoriesArray);
  } catch (e) {
    console.log(e.message);
  }

  return categoriesArray;
}

async function scrapeCategoryString(page) {
  let categories = [];
  const breadcrumbsItems = await page.$$(
    "ul.breadcrumbs.ng-star-inserted li.breadcrumbs__item.ng-star-inserted"
  );
  for (let index = 0; index < breadcrumbsItems.length; index++) {
    const item = breadcrumbsItems[index];
    const crumbHandle = await item.$("a.breadcrumbs__link span");
    const crumbText = await page.evaluate((el) => el.textContent, crumbHandle);
    categories.push(crumbText);
  }

  return categories.join(",");
}

function findCategories(categoryString, product) {
  const categoriesMatched = CATEGORIES_INTERFACE.filter((category) => {
    return categoryString.toLowerCase().includes(category.path.toLowerCase());
  });

  const categoriesIds = categoriesMatched.map((category) => {
    if (isObject(category._id)) {
      const categoriesEntries = Object.entries(category._id).filter(
        ([key, value]) => {
          return (
            product?.name.toLowerCase().includes(key.toLowerCase()) ||
            product?.description["Опис"]
              .toLowerCase()
              .includes(key.toLowerCase())
          );
        }
      );
      // console.log(categoriesEntries);
      const ids = categoriesEntries.map(([key, value]) => value);
      return ids;
    } else {
      return category._id;
    }
  });

  return categoriesIds.flat(Infinity);
}

function isObject(subject) {
  return typeof subject === "object";
}

function pasteIds(categoriesArray) {
  const categoriesIds = categoriesArray.map(function getCategoryId(category) {
    const dbCategory = ALL_CATEGORIES.find((dbCategory) => {
      return dbCategory.path === category;
    });
    if (!dbCategory) {
      return category;
    } else {
      return dbCategory._id;
    }
  });
  return categoriesIds;
}
