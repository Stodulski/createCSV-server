const axios = require("axios");
const { parse } = require("node-html-parser");
const File = require("../model/file");
const chromium = require("@sparticuz/chromium-min");
const puppeteer = require("puppeteer-core");

const getUrls = async (url) => {
    try {
        const response = await axios.get(url);
        const html = response.data;
        const root = parse(html);
        const links = root
            .querySelectorAll('a[itemprop="url"]')
            .map((link) => link.getAttribute("href"));
        return links;
    } catch (error) {
        console.error("Error al obtener los enlaces:", error);
        return [];
    }
};

const scrapeProductInfo = async (urls, usdToPenRate, cleanUrl) => {
    const browser = await puppeteer.launch({
        args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(
            `https://github.com/Sparticuz/chromium/releases/download/v116.0.0/chromium-v116.0.0-pack.tar`
        ),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
    });
    const productCollection = [];
    try {
        for (let url of urls) {
            const page = await browser.newPage();
            try {
                await page.goto(cleanUrl.origin + url, {
                    waitUntil: "domcontentloaded",
                });
                await autoScroll(page);
                const productInfo = await page.evaluate(() => {
                    const convertToHTMLList = (description) => {
                        const lines = description.split("\n");
                        let html = "<ul>";
                        lines.forEach((line) => {
                            html += `<li>${line}</li>`;
                        });
                        html += "</ul>";
                        return html;
                    };

                    const productBrand =
                        document.querySelector('span[itemprop="name"]')
                            ?.innerText || "";
                    const productSku =
                        document.querySelector('span[itemprop="sku"]')
                            ?.innerText || "";
                    const oldPrice = parseFloat(
                        document
                            .querySelector('span[itemprop="price"]')
                            ?.getAttribute("content") || "0"
                    );
                    const productPriceUsd = parseFloat(
                        (oldPrice * 1.4).toFixed(2)
                    );
                    const productTitle =
                        document
                            .querySelector('meta[itemprop="name"]')
                            ?.getAttribute("content") || "";
                    const productCategory =
                        document
                            .querySelector('meta[itemprop="category"]')
                            ?.getAttribute("content") || "";
                    const productImage =
                        document
                            .querySelector('img[itemprop="image"]')
                            ?.getAttribute("src") || "";
                    const productDescription = convertToHTMLList(
                        document.querySelector('div[itemprop="description"]')
                            ?.innerText || ""
                    );
                    const availability =
                        document
                            .querySelector('meta[itemprop="availability"]')
                            ?.getAttribute("content")
                            ?.indexOf("OutOfStock") > -1;
                    const productStock = !availability;
                    const productHandle = productTitle.replace(/ /g, "-");
                    const productTags =
                        document
                            .querySelector('meta[name="keywords"]')
                            ?.getAttribute("content") || "";

                    return {
                        productHandle,
                        productBrand,
                        productCategory,
                        productPriceUsd,
                        productImage,
                        productTitle,
                        productSku,
                        productDescription,
                        productStock,
                        productTags,
                    };
                });
                productInfo.productPricePen = parseFloat(
                    (productInfo.productPriceUsd * usdToPenRate).toFixed(2)
                );
                productCollection.push(productInfo);
            } catch (error) {
                console.error(`Error al acceder a ${url}:`, error);
            } finally {
                await page.close();
            }
        }
        return productCollection;
    } catch (error) {
        console.error("Error en el scraping:", error);
    } finally {
        await browser.close();
    }
};

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            let totalHeight = 0;
            const distance = 1000;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 50);
        });
    });
}
function getFormattedDateTime() {
    let now = new Date();
    let day = now.getDate();
    let month = now.getMonth() + 1;
    let year = now.getFullYear();
    let hours = now.getHours().toString().padStart(2, "0");
    let minutes = now.getMinutes().toString().padStart(2, "0");
    let seconds = now.getSeconds().toString().padStart(2, "0");
    let formattedDate = `${year}.${month}.${day}`;
    let formattedTime = `${hours}.${minutes}.${seconds}Hs`;
    return `${formattedDate}-${formattedTime}`;
}
async function getPenRate(page) {
    const priceResponse = await axios.get(
        "https://api.exchangerate-api.com/v4/latest/USD"
    );
    const usdToPenRate = priceResponse.data.rates.PEN;
    return usdToPenRate;
}
const saveCsvInDataBase = async (name, content) => {
    try {
        const newFile = new File({
            name,
            content,
        });
        const savedFile = await newFile.save();
        return savedFile;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    getUrls,
    scrapeProductInfo,
    getPenRate,
    getFormattedDateTime,
    saveCsvInDataBase,
};
