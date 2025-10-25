import { init } from "./init.js";
import CyrillicToTranslit from "cyrillic-to-translit-js";
import { mkdir } from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { writeToFile } from "./utils/writeToFile.js";
import * as fs from "fs";

// --- Configuration ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const URLS = [
    "https://akb-st.com.ua/ua/g112248703-eurocraft-monbatbolgariya",
    "https://akb-st.com.ua/ua/g112248703-eurocraft-monbatbolgariya/page_2",
    // ... rest of the pages are skipped for brevity ...
    "https://akb-st.com.ua/ua/g89470512-kainar-kazahstan",
];

const selectors = {
    // Selectors for elements on the PRODUCT PAGE
    product: {
        name: "span[data-qaid='product_name']",
        price: ".cs-sticky-panel__price", // Placeholder selector
        description: "div.ck-alert_theme_orange + div", // Complex selector for description
        characteristics: "table.b-product-info",
        mainImage: "img[data-qaid='img_product_sticky_panel']",
    },
    // Selectors for elements on the CATEGORY PAGE
    listing: {
        gallery: "ul.cs-product-gallery__list", // Container
        // Target individual product list item, assuming the class from previous context
        galleryItem: "li.cs-product-gallery__item.js-productad", 
        // Target the main clickable link inside the gallery item (adjust if needed)
        link: "a[data-edit-role='productInfo'] + a[data-edit-role='productInfo'] + a[data-edit-role='productInfo'] + a",
    },
};

// Assuming this is defined/imported elsewhere
const randomUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"; 

// --- Core Logic ---

async function main() {
    const { browser, page } = await init("https://akb-st.com.ua/ua");

    // FIX: Iterate using 'for...of' to get the URL string directly
    for (const url of URLS) { 
        await loop(page, url); // Pass 'page' to loop
    }

    await browser.close();
}

/**
 * The main scraping loop for a single category page.
 * Clicks through all products, scrapes them, and navigates back.
 */
async function loop(page, url) {

    // The image listener setup remains (it's active globally on the page)
    const imagesUrls = new Set();
    page.on("response", (res) => {
        const resType = res.request().resourceType();
        const resUrl = res.url();
        // Regex is correct for case-insensitive matching of 'akum' or 'bat'
        if (resType == "image" && resUrl.match(/akum|bat/i)) { 
            imagesUrls.add(resUrl);
        }
    });

    await page.setUserAgent(randomUserAgent);
    console.log(`Navigating to category: ${url}`);
    await page.goto(url, {
        waitUntil: "domcontentloaded",
    });

    // 1. Get all product card handles
    // FIX: Target the individual list items, not the gallery container
    const productCards = await page.$$(selectors.listing.galleryItem);
    const scrapedProducts = [];
    
    console.log(`Found ${productCards.length} products on this page.`);

    for (let i = 0; i < productCards.length; i++) {
        // Re-select the handles on each iteration in case DOM changes after navigation
        const currentProductCard = (await page.$$(selectors.listing.galleryItem))[i];
        
        if (!currentProductCard) {
            console.error(`Could not find product card at index ${i}. Stopping.`);
            break;
        }

        // 2. Get the clickable link inside the card
        const productLinkHandle = await currentProductCard.$(selectors.listing.link);
        
        if (!productLinkHandle) {
            console.error(`Could not find link in card at index ${i}. Skipping.`);
            continue;
        }

        // Get the product URL for navigation (safer than page.click)
        const productUrl = await page.evaluate(el => el.href, productLinkHandle);
        
        console.log(`-- Visiting product: ${productUrl}`);

        // 3. Navigate to the product page
        await page.goto(productUrl, { waitUntil: "domcontentloaded" });

        // 4. Scrape the data
        const product = {
            name: await getName(page),
            price: await getPrice(page),
            description: await getDescription(page),
            characteristics: await getCharacteristics(page),
        };
        
        // Determine brand for file naming
        const brand = product.characteristics?.['Виробник'] || 'unknown_brand';
        
        // Scrape and download images
        product.images = await getImages(page, product, imagesUrls, brand);

        scrapedProducts.push(product);
        
        // 5. Go back to the category page to continue the loop
        console.log(`-- Navigating back to category.`);
        await page.goBack({ waitUntil: "domcontentloaded" });
        
        // NOTE: After page.goBack(), you must be careful, as the DOM elements 
        // referenced by the outer loop might be stale. Re-selecting on each 
        // iteration (as done above) helps mitigate this.
        
        // Clear imagesUrls for the next product (optional, but cleaner)
        imagesUrls.clear(); 
    }
    
    // Save results for this page (optional)
    // await writeToFile(scrapedProducts, `products_from_${path.basename(url)}.json`);
}


// --- Scraper Functions (Stubs and Logic based on previous context) ---

async function getName(page) {
    const nameHandle = await page.$(selectors.product.name);
    return nameHandle ? await page.evaluate(el => el.textContent.trim(), nameHandle) : null;
}

async function getPrice(page) {
    const priceHandle = await page.$(selectors.product.price);
    return priceHandle ? await page.evaluate(el => el.textContent.trim(), priceHandle) : null;
}

async function getDescription(page) {
    let text = "";
    try {
        const container = await page.$(selectors.product.description);
        if (container) {
            text = await page.evaluate(el => {
                let content = "";
                const alerts = document.querySelectorAll(".ck-alert:not(.ck-alert_theme_green)");
                alerts.forEach(alert => content += alert.outerHTML);
                const h2s = document.querySelectorAll("h2");
                h2s.forEach(h2 => content += h2.outerHTML);
                return content;
            }, container);
        }
    } catch (e) {
        console.log(`Error getting description: ${e.message}\n`);
    }
    return { Опис: text.trim() };
}

async function getCharacteristics(page) {
    const characteristics = {};
    try {
        const table = await page.$(selectors.product.characteristics);
        if (table) {
            const tableData = await page.evaluate(tableElement => {
                const data = {};
                tableElement.querySelectorAll("tr").forEach(row => {
                    const cells = row.querySelectorAll("td");
                    if (cells.length === 2) {
                        const label = cells[0].textContent.trim();
                        const value = cells[1].textContent.trim().replace(/\s+/g, " ");
                        data[label] = value.replace(/"/g, "").trim();
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

// NOTE: Modified to accept the imagesUrls set collected by the response listener
async function getImages(page, product, imagesUrls, brand) {
    const imagesPaths = [];
    
    // 1. Get the main image URL from the sticky panel as primary source
    const mainImageHandle = await page.$(selectors.product.mainImage);
    if (mainImageHandle) {
        const mainImageUrl = await page.evaluate(img => img.src, mainImageHandle);
        if (mainImageUrl) {
            imagesUrls.add(mainImageUrl.replace(/_w\d+_h\d+/, '')); // Add high-res version
        }
    }
    
    const imagesUrlsArray = Array.from(imagesUrls);
    
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

// --- Helper Functions (From previous steps) ---

async function downloadImage(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        // Using response.buffer() assumes node-fetch or similar context
        return response.buffer(); 
    } catch (error) {
        // console.error(`Download error for ${url}:`, error.message);
        return null;
    }
}

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
