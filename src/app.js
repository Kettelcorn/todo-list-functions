require('dotenv').config()
const requests = require('./requests.js')

const notion_token = process.env.NOTION_TOKEN;

async function main(data_source) {
    results = {}
    results.uncheck_daily = await uncheckDaily(data_source);
    results.update_recurring = await updateRecurring(data_source);
    results.trash_checked_backlog = await trashCheckedBacklog(data_source);
    generateFinalMessage(results)
}

// Unchecks all daily tasks
async function uncheckDaily(data_source) {
    const dailyFilter = requests.generateFilter(true, [
        "Daily"
    ])
    const filteredTasks = await requests.getTasks(data_source, dailyFilter);
    const results = await requests.updateChecks(filteredTasks, false);
    return results;
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
    const results = await requests.updateTasks(checkedBacklog, {
        in_trash: true
    })
    return results
    
}

function generateFinalMessage(results) {
    console.log("")
    console.log("------------------------------------")
    console.log("Summary of changes:")
    console.log("------------------------------------")
    console.log(`Unchecked ${results.uncheck_daily.length} daily tasks`)
    console.log(`Updated numbers for ${results.update_recurring.length - 1} recurring tasks`)
    console.log(`Unchecked ${results.update_recurring[results.update_recurring.length - 1].length} recurring tasks`)
    console.log(`Moved ${results.trash_checked_backlog.length} backlog tasks to trash`)
}

module.exports = { main, uncheckDaily, updateRecurring, trashCheckedBacklog }