const app = require('../app.js');
const requests = require('../requests.js');
require('dotenv').config();

/**
 * Run for develepment environment
 */
async function execute() {
    const data_source = await requests.getDataSourceId(process.env.TEST_DATA_URL);
    app.main(data_source);
}

execute();
