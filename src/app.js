require('dotenv').config()
const requests = require('./requests.js')

const notion_token = process.env.NOTION_TOKEN;

async function main(data_source) {
    uncheckDaily(data_source);
    updateRecurring(data_source);
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
async function updateRecurring(data_source) {
    const recurringFilter = {
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
                            multi_select: { contains: "Every other day" },
                        },
                        {
                            property: 'Tags',
                            multi_select: { contains: "Semiweekly" },
                        },
                        {
                            property: 'Tags',
                            multi_select: { contains: "Weekly" },
                        },
                        {
                            property: 'Tags',
                            multi_select: { contains: "Biweekly" },
                        },
                        {
                            property: 'Tags',
                            multi_select: { contains: "Monthly" },
                        },
                        {
                            property: 'Tags',
                            multi_select: { contains: "Semiannually" },
                        },
                        {
                            property: 'Tags',
                            multi_select: { contains: "Yearly" },
                        }
                    ]
                }
            ]
        }
    };
    const recurringTasks = await requests.getTasks(data_source, recurringFilter)
    const complete = await requests.updateRecurring(recurringTasks);
    return complete;
}

module.exports = { main, uncheckDaily, updateRecurring }