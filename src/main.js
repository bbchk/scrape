import { init } from "./init.js";
import CyrillicToTranslit from "cyrillic-to-translit-js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { mkdir } from "fs/promises";
import * as path from "path";
import * as fs from "fs";
import { writeToFile } from "./utils/writeToFile.js"; // Assuming this utility exists

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Target Category URL (Kainar Kazakhstan)
const URLS = [
    "https://akb-st.com.ua/ua/g89470512-kainar-kazahstan", // Only one category URL needed now
];

// Selectors for elements on the PRODUCT PAGE (used in scrapeProductPage)
const PRODUCT_TITLE_SELECTOR = "span[data-qaid='product_name']";
const CHARACTERISTICS_TABLE_SELECTOR = "table.b-product-info";
const DESCRIPTION_CONTAINER_SELECTOR = "div.ck-alert_theme_orange + div";
const MAIN_IMAGE_SELECTOR = "img[data-qaid='img_product_sticky_panel']";

// Selectors for elements on the CATEGORY PAGE (used in crawlCategory)
const PRODUCT_GALLERY_ITEM_SELECTOR = "ul.cs-product-gallery__list li.js-productad";
const PRODUCT_LINK_SELECTOR = "a[data-edit-role='productInfo'] + a[data-edit-role='productInfo'] + a[data-edit-role='productInfo'] + a"; // Target the primary link inside the LI
const PAGINATION_NEXT_SELECTOR = "div.b-pager a.b-pager__link_pos_last";

// --- Utility function stubs ---
const randomUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

async function downloadImage(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        return response.buffer();
    } catch (error) {
        console.error(`Download error for ${url}:`, error.message);
        return null;
    }
}
// ------------------------------

async function main() {
    const { browser, page } = await init("https://akb-st.com.ua/ua");

    const allProducts = [];

    for (const startUrl of URLS) {
        // We now call a single function to handle the entire category crawl
        const categoryProducts = await crawlCategory(page, startUrl);
        allProducts.push(...categoryProducts);
    }

    // Save all collected data (assuming writeToFile handles the array)
    // await writeToFile(allProducts, 'all_scraped_products.json');

    await browser.close();
}

/**
 * Main logic to loop through all pages of a category.
 */
async function crawlCategory(page, startUrl) {
    let currentPageUrl = startUrl;
    const allProducts = [];

    while (currentPageUrl) {
        console.log(`\nNavigating to category page: ${currentPageUrl}`);
        await page.setUserAgent(randomUserAgent);
        await page.goto(currentPageUrl, {
            waitUntil: "domcontentloaded",
        });
        
        // Ensure the gallery view is selected if necessary (or just scrape the list)
        // No explicit view setting needed, as we scrape the visible list.

        const productsOnPage = await scrapeCategoryPage(page);
        allProducts.push(...productsOnPage);

        // Check for next page link
        const nextPageLink = await page.$(PAGINATION_NEXT_SELECTOR);
        if (nextPageLink) {
            currentPageUrl = await page.evaluate(el => el.href, nextPageLink);
        } else {
            currentPageUrl = null; // Exit the loop
        }
    }
    
    return allProducts;
}

/**
 * Scrapes all product links on the current category page, visits each, and scrapes the data.
 */
async function scrapeCategoryPage(page) {
    const scrapedProducts = [];
    
    // Get all product list item handles
    const productItemHandles = await page.$$(PRODUCT_GALLERY_ITEM_SELECTOR);
    
    console.log(`Found ${productItemHandles.length} products on the current page.`);

    for (const itemHandle of productItemHandles) {
        const productLinkHandle = await itemHandle.$(PRODUCT_LINK_SELECTOR);

        if (productLinkHandle) {
            const productUrl = await page.evaluate(el => el.href, productLinkHandle);
            
            console.log(`-- Scraping product: ${productUrl}`);

            // 1. Visit the product page
            await page.goto(productUrl, { waitUntil: "domcontentloaded" });

            // 2. Scrape the data
            const productData = await scrapeProductPage(page);

            // 3. Add to array
            scrapedProducts.push(productData);
            
            // 4. Navigate back to the category page to continue the list loop
            await page.goBack({ waitUntil: "domcontentloaded" });
        }
    }
    
    return scrapedProducts;
}

/**
 * Scrapes all necessary information from a single product page.
 */
async function scrapeProductPage(page) {
    const product = {
        name: await getName(page),
        description: await getDescription(page),
        characteristics: await getCharacteristics(page),
    };

    // Determine brand for file naming (must be available before getImages)
    const brand = product.characteristics?.['Виробник'] || 'unknown_brand';
    
    // Scrape images
    product.images = await getImages(page, product, brand);

    return product;
}

// --- Scrape Functions (Modified for Product Page Context) ---

async function getName(page) {
    const nameHandle = await page.$(PRODUCT_TITLE_SELECTOR);
    if (nameHandle) {
        return await page.evaluate((el) => el.textContent.trim(), nameHandle)
            .catch((e) => console.log(`Error getting name: ${e.message}\n`));
    }
    return null;
}

async function getDescription(page) {
    let text = "";
    try {
        const descriptionContainer = await page.$(DESCRIPTION_CONTAINER_SELECTOR);
        if (descriptionContainer) {
            text = await page.evaluate((el) => {
                // Select and combine content from alerts and H2 tags before the table
                let content = "";
                const alerts = document.querySelectorAll(".ck-alert:not(.ck-alert_theme_green)");
                alerts.forEach((alert) => (content += alert.outerHTML));

                const h2s = document.querySelectorAll("h2");
                h2s.forEach((h2) => (content += h2.outerHTML));

                return content;
            }, descriptionContainer);
        }
    } catch (e) {
        console.log(`Error getting description: ${e.message}\n`);
    }

    return { Опис: text.trim() };
}

async function getCharacteristics(page) {
    const characteristics = {};
    try {
        const table = await page.$(CHARACTERISTICS_TABLE_SELECTOR);

        if (table) {
            const tableData = await page.evaluate((tableElement) => {
                const data = {};
                const rows = tableElement.querySelectorAll("tr");

                rows.forEach((row) => {
                    const cells = row.querySelectorAll("td");
                    if (cells.length === 2) {
                        const label = cells[0].textContent.trim();
                        const value = cells[1].textContent.trim().replace(/\s+/g, " ");

                        if (label === "Полярність") {
                            data[label] = value.replace(/"/g, "").trim();
                        } else {
                            data[label] = value;
                        }
                    }
                });
                return data;
            }, table);

            Object.assign(characteristics, tableData);
        }
    } catch (e) {
        console.log(`Error getting characteristics: ${e.message}\n`);
    }

    return characteristics;
}

/**
 * Retrieves image URLs directly from the product page (no longer relies on response listener)
 */
async function getImages(page, product, brand) {
    const imagesUrls = new Set();
    
    // 1. Get the main image URL from the sticky panel/gallery
    const mainImageHandle = await page.$(MAIN_IMAGE_SELECTOR);
    if (mainImageHandle) {
        const mainImageUrl = await page.evaluate(img => img.src, mainImageHandle);
        if (mainImageUrl) {
            imagesUrls.add(mainImageUrl.replace(/_w\d+_h\d+/, '')); // Use full size image if available
        }
    }

    // You might need to query a gallery block here if the product had more images.
    // Based on the provided HTML, only the sticky panel image is explicitly visible.
    // If there's a gallery, you would need to add its selector here.

    const imagesUrlsArray = Array.from(imagesUrls);
    const imagesPaths = [];

    // Setup for file naming
    const productWithEntry = {
        ...product,
        brand: brand,
        entry: product.name || 'default_product_name'
    };
    const { folderName, fileName: baseFileName } = getImagePath(productWithEntry);

    // 2. Download and save the images
    for (let index = 0; index < imagesUrlsArray.length; index++) {
        const imageUrl = imagesUrlsArray[index];
        const extension = imageUrl.split(".").pop().split("?")[0];
        const fileName = `${baseFileName}_${index}.${extension}`;
        
        const buffer = await downloadImage(imageUrl);

        if (buffer) {
            await saveImageFile(buffer, folderName, fileName);
            imagesPaths.push(
                `https://storage.googleapis.com/live_world/${folderName}/${fileName}`,
            );
        }
    }
    return imagesPaths;
}


// --- Helper Functions ---

function getImagePath(product) {
    let folderName = `images/${product.brand}_images`
        .toLowerCase()
        .split(" ")
        .join("_");

    const cyrillicToTranslit = new CyrillicToTranslit();
    let fileName = cyrillicToTranslit
        .transform(product.entry) 
        .toLowerCase()
        .split(" ")
        .join("_")
        .replaceAll('"', "")
        .replaceAll("*", "_")
        .replaceAll("'", "")
        .replaceAll("/", "_");

    return { folderName, fileName };
}

async function saveImageFile(buffer, folderName, fileName) {
    const filePath = path.resolve(folderName, fileName);

    if (!fs.existsSync(path.dirname(filePath))) {
        await mkdir(path.dirname(filePath), { recursive: true });
    }
    fs.writeFileSync(filePath, buffer, "binary"); 
}

main();
