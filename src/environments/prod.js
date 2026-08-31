const app = require('../app.js');
const requests = require('../requests.js');
require('dotenv').config();

/**
 * Run for production environment
 */
async function execute() {
    const data_source = await requests.getDataSourceId(process.env.DATA_URL);
    console.log(`This is the data source: ${data_source}`);
    app.main(data_source);
}

execute();
