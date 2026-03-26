const app = require('../app.js');
const requests = require('../requests.js');
require('dotenv').config();

async function execute() {
    const data_source = await requests.getDataSourceId(process.env.DATA_URL);
    app.main(data_source);
}

execute();
