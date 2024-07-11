const mongoose = require("mongoose");

const uri = process.env.DB;

mongoose
    .connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("Conexión establecida con MongoDB");
    })
    .catch((err) => {
        console.error("Error al conectar con MongoDB:", err);
    });
