const express = require("express");
const helmet = require("helmet");
require("dotenv").config();

require("./config/database");

const app = express();

app.use(helmet());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("SecureDMS Backend Running");
});

module.exports = app;