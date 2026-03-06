const app = require("../app.js")
require('dotenv').config()

const data_source = app.getDataSourceId(process.env.STAGE_DATA_URL);
app.main(data_source)

