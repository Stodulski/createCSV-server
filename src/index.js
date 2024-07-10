const express = require("express");
const cors = require("cors");
const helmet = require('helmet')
const authRoute = require("./router/auth.js");
const fileRoute = require("./router/file.js");

require("dotenv").config();

require("./db.js");

const app = express();

const { verifyToken } = require("./controller/user.js");

app.use(cors());
app.use(helmet())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    if (req.path === "/login" || req.path === "/csv/new") {
        return next();
    }
    verifyToken(req, res, next);
});

app.use(authRoute);
app.use(fileRoute);

app.listen(process.env.PORT || 3000, () => {
    console.log("Server started");
});
