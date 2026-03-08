require('dotenv').config()
const requests = require('./requests.js')

const notion_token = process.env.NOTION_TOKEN;

async function main(data_source) {
    uncheckDaily(data_source);
    updateWeekly(data_source);
}

// Unchecks all daily tasks
async function uncheckDaily(data_source) {
    const dailyFilter = {
        filter: {
            "and": [
                {
                    property: "Checkbox",
                    checkbox: { equals: true},   
                },
                {
                    "or": [
                        {
                            property: 'Tags',
                            multi_select: { contains: "Morning" },
                        },
                        {
                            property: 'Tags',
                            multi_select: { contains: "Afternoon"},
                        },
                        {
                            property: 'Tags',
                            multi_select: { contains: "Evening"},
                        }
                    ]
                }
            ]
        }
    }
    const filteredTasks = await requests.getTasks(data_source, dailyFilter);
    return await requests.updateChecks(filteredTasks, false);
}

// Updates weekly tasks based on number and checkbox
async function updateWeekly(data_source) {
    const weeklyFilter = {
        filter: {
            "and": [
                {
                    property: "Checkbox",
                    checkbox: { equals: true},   
                },
                {
                    "or": [
                        {
                            property: 'Tags',
                            multi_select: { contains: "Weekly" },
                        }
                    ]
                }
            ]
        }
    };
    const weeklyTasks = await requests.getTasks(data_source, weeklyFilter)
    const complete = await requests.updateWeekly(weeklyTasks);
    return complete;
}

module.exports = { main, uncheckDaily, updateWeekly }