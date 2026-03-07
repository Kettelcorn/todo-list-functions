const app = require("../app.js")
require('dotenv').config()

async function execute() {
    if (process.env.NODE_ENV == 'local') {
        let data;
        try {
            const result = await fetch(`https://api.render.com/v1/services/${process.env.RENDER_SERVICE_ID}/jobs`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RENDER_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    startCommand: 'npm run stage' 
                })
            })
            data = await result.json();
        } catch (error) {
            console.error("Failed to trigger one-off job: ", error);
        }
    } else {
        const data_source = await app.getDataSourceId(process.env.STAGE_DATA_URL);
        app.main(data_source)
    }
}

execute();