const {
    getUrls,
    scrapeProductInfo,
    getPenRate,
    getFormattedDateTime,
    saveCsvInDataBase,
} = require("../functions/file");

const File = require("../model/file.js");
const { parse } = require("json2csv");

const createNewCsv = async (req, res) => {
    try {
        const { url } = req.body;

        const cleanUrl = new URL(url);

        const usdToPenRate = await getPenRate();

        const urls = await getUrls(url);
        const data = await scrapeProductInfo(urls, usdToPenRate, cleanUrl);

        const newCsv = data.map((product) => ({
            Handle: product.productHandle,
            Title: product.productTitle,
            Vendor: product.productBrand,
            SKU: product.productSku,
            "Variant Price": product.productPricePen,
            "Variant Price (USD)": product.productPriceUsd,
            "Image Src": product.productImage,
            "Body (HTML)": product.productDescription,
            Tags: product.productTags,
            Type: product.productCategory,
            Published: product.productStock,
        }));

        const csv = parse(newCsv);
        const date = getFormattedDateTime();
        const filename = `${date}.csv`;

        res.setHeader("Content-Type", "text/csv");

        res.status(200).json({
            text: "CSV created",
            name: filename,
            csv,
        });
        await saveCsvInDataBase(csvWriter.fileWriter.path, newCsv);
    } catch (err) {
        console.log(err);
        res.status(500).json({ text: "Error" });
    }
};

const downloadFile = async (req, res) => {
    const file = req.params.file;
    const response = await File.findById(file);
    const newCsv = response.content.map((product) => ({
        Handle: product.Handle,
        Title: product.Title,
        Vendor: product.Vendor,
        SKU: product.SKU,
        "Variant Price": product.PricePen,
        "Variant Price (USD)": product.PriceUsd,
        "Image Src": product.Image,
        "Body (HTML)": product.Body,
        Tags: product.Tags,
        Type: product.Category,
        Published: product.Stock,
    }));
    const csv = parse(newCsv);
    res.json({ name: response.name, csv });
};

const getCsv = async (req, res) => {
    const files = await File.find();
    res.status(200).json(files);
};
const deleteCsv = async (req, res) => {
    try {
        const id = req.query.id;
        await File.findByIdAndDelete(id);
        res.status(200).json({ text: "Deleting..." });
    } catch (error) {
        res.status(404).json({ text: "Error when deleting" });
    }
};

module.exports = { createNewCsv, downloadFile, getCsv, deleteCsv };
