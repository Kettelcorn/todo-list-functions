const app = require('../app.js');
const requests = require('../requests.js');
require('dotenv').config();

/**
 * Run for staging environment
 */
async function execute() {
    if (process.env.NODE_ENV == 'local') {
        requests.oneOffJob();
    } else {
        const data_source = await requests.getDataSourceId(process.env.STAGE_DATA_URL);
        app.main(data_source);
    }
}

execute();
