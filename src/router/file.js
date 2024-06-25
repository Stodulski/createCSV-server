const express = require("express");
const router = express.Router();
const { createNewCsv, downloadFile, getCsv, deleteCsv } = require("../controller/file");

router.post("/csv/new", createNewCsv);
router.get("/csv/get", getCsv);
router.delete("/csv/delete", deleteCsv);
router.get("/files/:file", downloadFile);

module.exports = router;
