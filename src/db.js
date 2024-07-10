const mongoose = require("mongoose");

const uri = "mongodb+srv://admin:w79F6UhQqKWGAc8@cluster0.tknnieb.mongodb.net/csv";

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
