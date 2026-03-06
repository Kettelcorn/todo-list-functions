const app = require("../app.js")
require('dotenv').config()

const data_source = app.getDataSourceId(process.env.DATA_URL);
app.main(data_source)