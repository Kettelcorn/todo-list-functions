// This file contains functions involved in calling external API's, primarily Notion

require('dotenv').config()
const notion_token = process.env.NOTION_TOKEN;

// Gets all tasks with the specific filter applied. Pass in {} for no filters if you want all tasks
async function getTasks(data_source, filters){
    let data;
    try {
        const response = await fetch(`https://api.notion.com/v1/data_sources/${data_source}/query`, {
            method: 'POST',
            headers: {
                'Authorization': `${notion_token}`,
                'Notion-Version': '2025-09-03',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(filters)
        });
        data = await response.json();
    } catch (error) {
        console.error('Failed to get filtered tasks: ', error)
    }
    let tasks = [];
    for (let i = 0; i < data.results.length; i++) {
        tasks.push(data.results[i]);
    }
    const moreTasks = await hasMore(data, data_source, filters)
    for (let i = 0; i < moreTasks.length; i++) {
        tasks.push(moreTasks[i]);
    }
    return tasks
}

// If tasks number exceeds 100, request next batch
async function hasMore(data, data_source, filters){
    if (data.has_more) {
        let tasks = []
        let current_data = data;
        let has_more = data.has_more;
        while (has_more) {
            let temp;
            try {
                const response = await fetch(`https://api.notion.com/v1/data_sources/${data_source}/query`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `${notion_token}`,
                        'Notion-Version': '2025-09-03',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        start_cursor: current_data.next_cursor,
                        filter: filters.filter
                    })
                });
                temp = await response.json();
            } catch (error) {
                console.error('Failed to get more tasks: ', error)
            } 
            for (let i = 0; i < temp.results.length; i++) {
                tasks.push(temp.results[i])
            }
            console.log(`Tasks is now ${tasks.length} long`)
            if (temp.has_more) {
                current_data = temp;
            } else {
                return tasks;
            }
        } 
    } else {
        return []
    }
}

async function updateTasks(tasks, params) {
    for (let i = 0; i < tasks.length; i ++) {
        let data;
        try {
            const response = await fetch(`https://api.notion.com/v1/pages/${tasks[i].id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${notion_token}`,
                    'Notion-Version': '2025-09-03',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params)
            });
            data = await response.json();
            if (tasks[i].properties.Name.title != null) {
                console.log(`Updated ${tasks[i].properties.Name.title[0].plain_text}:`)
            } else {
                console.log(`Updated NAME_NOT_FOUND:`)
            }
            console.log(params);
        } catch (error) {
            console.error(error);
        }
    }
    return true;
}

// Will either check or uncheck all tasks passed in based on the isChecked value
async function updateChecks(tasks, isChecked) {
    if (isChecked) {
        console.log(`Adding checks to ${tasks.length} tasks`)
    } else {
        console.log(`Removing checks from ${tasks.length} tasks`)
    }
    await updateTasks(tasks, {
        properties: {
            Checkbox: {
                checkbox: isChecked,
            }
        }
    });    
    if (isChecked) {
        console.log(`Added checkboxes to ${tasks.length} tasks`);
    } else {
        console.log(`Removed checkboxes from ${tasks.length} tasks`);
    }   
     //TODO: update to base on response rather than hardcode true
    return true;
}

// Updates the number and checkbox values for each weekly tasks
async function updateRecurring(tasks) {
    let needsUncheck = []
    for (let i = 0; i < tasks.length; i++) {
        let daysLeft = tasks[i].properties.Number.number;
        if (daysLeft == null || daysLeft == 0) {
            const days = getDayCount(tasks[i]) - 1
            await updateNumber(tasks[i], days);
        } else {
            await updateNumber(tasks[i], daysLeft - 1)
            if (daysLeft - 1 == 0) {
                needsUncheck.push(tasks[i]);
            }
        }
    }
    await updateChecks(needsUncheck, false);
    return true;
}

// Updates the number value for weekly tasks
async function updateNumber(task, newNumber) {
    let data;
    try {
        const response = await fetch(`https://api.notion.com/v1/pages/${task.id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${notion_token}`,
                'Notion-Version': '2025-09-03',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                properties: {
                    Number: {
                        number: newNumber,
                    } 
                }
            })
        });
        data = await response.json();
        let name;
        if (task.properties.Name.title.length > 0) {
            name = task.properties.Name.title[0].plain_text;
        } else {
            name = "NAME_NOT_FOUND"
        }
        console.log(`Updated ${name}'s number to ${newNumber}`)
    } catch (error) {
        console.error('Unable to update number value: ', error)     
    }
    return true;
}

// Returns number of days that should be inbetween reseting recurring tasks
function getDayCount(task) {
    let number = null;
    for (let i = 0; i < task.properties.Tags.multi_select.length; i++) {
        switch (task.properties.Tags.multi_select[i].name) {
            case 'Every other day':
                number = 2;
                break;
            case 'Semiweekly':
                number =4;
                break;
            case 'Weekly':
                number = 7;
                break;
            case 'Biweekly':
                number = 14;
                break;
            case 'Monthly':
                number = 30;
                break;
            case 'Semiannually':
                number = 183;
                break;
            case 'Yearly':
                number = 365;
                break;
        }
        if (number != null) {
            return number;
        }
    }
}

//Generate a filter based on passed in parameters:
//Pass in a list of tags you wish to filter. If the tags variable is passed in a null, no tags should be filtered.
//Pass in a boolean for checkboxes. If true, filtered for only checked tasks. If false, filter for unchecked tasks. If null, don't
// filter for checkboxes.
function generateFilter(checked, tags) {
    let tagFilters;
    let checkFilters;
    let newFilter = {};
    if (tags != null) {
        let orTags = [];
        for (let i = 0; i < tags.length; i++) {
            orTags.push({
                property: 'Tags',
                multi_select: { contains: tags[i] }
            })
        }
        if (tags.length > 1) {
            tagFilters = {
                "or": orTags
            }
        } else {
            tagFilters = orTags[0];
        }
        newFilter.filter = tagFilters;    
    }
    if (checked != null) {
        checkFilters = {
            property: 'Checkbox',
            checkbox: { equals: checked},
        }
        if (newFilter.filter != null) {
            return {
                filter: {
                    "and": [
                        checkFilters,
                        tagFilters
                    ]
                }
            }
        } else {
            newFilter.filter = checkFilters;
        }
    }
    return newFilter;
}

// Pass in the url of a database and return the data source id for that database
async function getDataSourceId(url) {
    let data;
    const mark = url.indexOf('?')
    const database_id = url.substring(mark - 32, mark)
    try {
        const response = await fetch(`https://api.notion.com/v1/databases/${database_id}`, {
            method: 'GET',
                headers: {
                    'Authorization': `Bearer ${notion_token}`,
                    'Notion-Version': '2025-09-03',
                    'Content-Type': 'application/json',
                }
        })
        data = await response.json();
    } catch (error) {
        console.error("Could not get data source: ", error);
    }
    return data.data_sources[0].id
}

// Pass in the url of a notion page and return the database url. Only works with the first database in the page.
async function getDataBaseId(url) {
    let data;
    const page_id = url.substring(url.length - 32, url.length)
    try {
        const response = await fetch(`https://api.notion.com/v1/pages/${page_id}`, {
            method: 'GET',
                headers: {
                    'Authorization': `Bearer ${notion_token}`,
                    'Notion-Version': '2025-09-03',
                    'Content-Type': 'application/json',
                }
        })
        data = await response.json();
    } catch (error) {
        console.error("Could not get data source: ", error);
    }
    return data.data_sources[0].id;
}

// Manually triggers a run of the cron job in the staging environment
async function oneOffJob() {
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
    return data;
}


module.exports = { 
    getTasks,
    updateTasks,
    updateChecks,
    updateRecurring,
    getDayCount,
    generateFilter,
    getDataSourceId,
    getDataBaseId, 
    oneOffJob,
 }