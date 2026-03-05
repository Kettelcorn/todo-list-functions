const index = require("index.js")
require('dotenv').config()

let data_source = process.env.DATA_SOURCE;
if (process.env.NODE_ENV == 'development') {
    data_source = process.env.TEST_DATA_SOURCE;
}
index.main(data_source);