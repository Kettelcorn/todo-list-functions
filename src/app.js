require('dotenv').config()
const requests = require('./requests.js')
const util = require('util')

const notion_token = process.env.NOTION_TOKEN;

async function main(data_source) {
    await uncheckDaily(data_source);
    await updateRecurring(data_source);
    await trashCheckedBacklog(data_source);
}

// Unchecks all daily tasks
async function uncheckDaily(data_source) {
    const dailyFilter = requests.generateFilter(true, [
        "Morning",
        "Afternoon",
        "Evening"
    ])
    const filteredTasks = await requests.getTasks(data_source, dailyFilter);
    return await requests.updateChecks(filteredTasks, false);
}

// Updates weekly tasks based on number and checkbox
async function updateRecurring(data_source) {
    const recurringFilter = requests.generateFilter(true, [
        "Every other day",
        "Semiweekly",
        "Weekly",
        "Biweekly",
        "Monthly",
        "Semiannually",
        "Yearly"
    ]);
    const recurringTasks = await requests.getTasks(data_source, recurringFilter)
    const complete = await requests.updateRecurring(recurringTasks);
    return complete;
}

async function trashCheckedBacklog(data_source) {
    const backlogFilter = requests.generateFilter(true, [
        "Backlog"
    ])
    const checkedBacklog = await requests.getTasks(data_source, backlogFilter);
    const complete = await requests.updateTasks(checkedBacklog, {
        in_trash: true
    })
    return complete
}

module.exports = { main, uncheckDaily, updateRecurring, trashCheckedBacklog }