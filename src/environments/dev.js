const app = require("../app.js")
require('dotenv').config()

async function execute() {
    const data_source = await app.getDataSourceId(process.env.TEST_DATA_URL);
    app.main(data_source)
}

execute();





