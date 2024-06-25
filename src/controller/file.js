const {
    getUrls,
    scrapeProductInfo,
    getPenRate,
    getFormattedDateTime,
    saveCsvInDataBase,
} = require("../functions/file");

const path = require("path");
const fs = require("fs").promises;
const File = require("../model/file.js");

const { createObjectCsvWriter } = require("csv-writer");

const createNewCsv = async (req, res) => {
    try {
        const { url } = req.body;

        const cleanUrl = new URL(url);

        const usdToPenRate = await getPenRate();

        const urls = await getUrls(url);

        const data = await scrapeProductInfo(urls, usdToPenRate, cleanUrl);

        let productName = getFormattedDateTime();
        const csvWriter = createObjectCsvWriter({
            path: path.join(__dirname, `../../files/${productName}.csv`),
            header: [
                { id: "Handle", title: "Handle" },
                { id: "Title", title: "Title" },
                { id: "Vendor", title: "Vendor" },
                { id: "Tags", title: "Tags" },
                { id: "Type", title: "Type" },
                { id: "SKU", title: "SKU" },
                { id: "PricePen", title: "Variant Price" },
                { id: "PriceUsd", title: "Variant Price (USD)" },
                { id: "Body", title: "Body (HTML)" },
                { id: "Image", title: "Image Src" },
                { id: "Published", title: "Published" },
            ],
        });

        const newCsv = data.map((product) => ({
            Handle: product.productHandle,
            Title: product.productTitle,
            Vendor: product.productBrand,
            SKU: product.productSku,
            PricePen: product.productPricePen,
            PriceUsd: product.productPriceUsd,
            Image: product.productImage,
            Body: product.productDescription,
            Tags: product.productTags,
            Type: product.productCategory,
            Published: product.productStock,
        }));

        await csvWriter.writeRecords(newCsv);
        res.status(200).json({
            text: "CSV created",
            name: csvWriter.fileWriter.path,
        });
        await saveCsvInDataBase(csvWriter.fileWriter.path, newCsv);
    } catch (err) {
        console.log(err);
        res.status(500).json({ text: "Error" });
    }
};

const downloadFile = (req, res) => {
    const file = req.params.file;
    const fileRoute = path.join(__dirname, "../../files", file);
    res.download(fileRoute, (err) => {
        if (err) {
            res.status(404).json({ text: "File not found" });
        }
    });
};

const getCsv = async (req, res) => {
    const files = await File.find();
    res.status(200).json(files);
};
const deleteCsv = async (req, res) => {
    try {
        const id = req.query.id;
        const result = await File.findByIdAndDelete(id);
        await fs.access(
            path.join(__dirname, `../../${result.name}`),
            fs.constants.F_OK
        );
        await fs.unlink(path.join(__dirname, `../../${result.name}`));
        res.status(200).json({ text: "Deleting..." });
    } catch (error) {
        res.status(404).json({ text: "Error when deleting" });
    }
};

module.exports = { createNewCsv, downloadFile, getCsv, deleteCsv };
