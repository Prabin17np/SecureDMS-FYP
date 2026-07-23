require('dotenv').config();
const https = require('https');
const fs = require('fs');
const app = require("./app");

const PORT = process.env.PORT || 5000;

const options = {
    key: fs.readFileSync('./cert/key.pem'),
    cert: fs.readFileSync('./cert/cert.pem')
};

https.createServer(options, app).listen(PORT, () => {
    console.log(`HTTPS server running on port ${PORT}`);
});
