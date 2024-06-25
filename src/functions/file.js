const axios = require("axios");
const { parse } = require("node-html-parser");
const File = require("../model/file");


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
    const productCollection = [];
    try {
        for (let url of urls) {
            try {
                const response = await axios.get(cleanUrl.origin + url);
                const html = response.data;
                const root = parse(html);

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
                    root.querySelectorAll('span[itemprop="name"]')[0]
                        ?.innerText || "";
                const productSku =
                    root.querySelectorAll('span[itemprop="sku"]')[0]
                        ?.innerText || "";
                const oldPrice = parseFloat(
                    root
                        .querySelectorAll('span[itemprop="price"]')[0]
                        ?.getAttribute("content") || "0"
                );
                const productPriceUsd = parseFloat((oldPrice * 1.4).toFixed(2));
                const productTitle =
                    root
                        .querySelectorAll('meta[itemprop="name"]')[0]
                        ?.getAttribute("content") || "";
                const productCategory =
                    root
                        .querySelectorAll('meta[itemprop="category"]')[0]
                        ?.getAttribute("content") || "";
                const productImage =
                    root
                        .querySelectorAll('img[itemprop="image"]')[0]
                        ?.getAttribute("src") || "";
                const productDescription = convertToHTMLList(
                    root.querySelectorAll('div[itemprop="description"]')[0]
                        ?.innerText || ""
                );
                const availability =
                    root
                        .querySelectorAll('meta[itemprop="availability"]')[0]
                        ?.getAttribute("content")
                        ?.indexOf("OutOfStock") > -1;
                const productStock = !availability;
                const productHandle = productTitle.replace(/ /g, "-");
                const productTags =
                    root
                        .querySelectorAll('meta[name="keywords"]')[0]
                        ?.getAttribute("content") || "";
                const productInfo = {
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

                productInfo.productPricePen = parseFloat(
                    (productInfo.productPriceUsd * usdToPenRate).toFixed(2)
                );
                productCollection.push(productInfo);
            } catch (error) {
                console.error(`Error al acceder a ${url}:`, error);
            }
        }
        return productCollection;
    } catch (error) {
        console.error("Error en el scraping:", error);
    } finally {
    }
};

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            let totalHeight = 0;
            const distance = 1000;
            const timer = setInterval(() => {
                const scrollHeight = root.body.scrollHeight;
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
