const test = require('node:test');
const assert = require('node:assert');
const index = require("../src/index.js");
require('dotenv').config()

test('Test removing checkmarks from daily tasks', async (t) => {
    const tasks = await getTasks();
    await addChecks(tasks);
    const checkedTasks = await getTasks()
    assert.ok(allChecked(checkedTasks))
    const complete = await index.main(process.env.TEST_DATA_SOURCE);
    if (complete) {
        const updatedTasks = await getTasks();
        assert.ok(onlyDailyUnchecked(updatedTasks))
    }
});


async function getTasks() {
    const data_source = process.env.TEST_DATA_SOURCE;
    const response = await fetch(`https://api.notion.com/v1/data_sources/${data_source}/query`, {
        method: 'POST',
        headers: {
            'Authorization': `${process.env.NOTION_TOKEN}`,
            'Notion-Version': '2025-09-03',
            'Content-Type': 'application/json',
        },
    });
    const data = await response.json();
    let tasks = []
    for (task in data.results) {
        tasks.push(task);
    }
    const moreTasks = await hasMore(data, data_source)
    for (let i = 0; i < moreTasks.length; i++) {
        tasks.push(moreTasks[i])
    }
    console.log(`Total tasks = ${tasks.length}`)
    return tasks
}

async function hasMore(data, data_source) {
    if (data.has_more) {
        let tasks = []
        let current_data = data;
        let has_more = data.has_more;
        while (has_more) {
            const response = await fetch(`https://api.notion.com/v1/data_sources/${data_source}/query`, {
                method: 'POST',
                headers: {
                    'Authorization': `${process.env.NOTION_TOKEN}`,
                    'Notion-Version': '2025-09-03',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    start_cursor: current_data.next_cursor,
                })
            });
            const temp = await response.json();
            for (let i = 0; i < temp.results.length; i++) {
                tasks.push(temp.results[i])
            }
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

async function addChecks(tasks) {
    for (let i = 0; i < tasks.length; i++) {
        const response = await fetch(`https://api.notion.com/v1/pages/${tasks[i].id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
                'Notion-Version': '2025-09-03',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                properties: {
                    Checkbox: {
                        checkbox: true,
                    } 
                }
            })
        });
        const data = await response.json();
        console.log(`Checked ${tasks[i].properties.Name.title[0].plain_text}, #${i + 1}`);
    }
    console.log(`Added checks t0 ${tasks.length} tasks`);    
}

function allChecked(tasks) {
    for (let i = 0; i < tasks.length; i++) {
        if (!tasks[i].properties.Checkbox.checkbox) {
            console.log(`${tasks[i].properties.Name.title[0].plain_text} did not get checked`);
            return false;
        }
    } 
    return true;
}

function onlyDailyUnchecked(tasks) {
    for (let i = 0; i < tasks.length; i++) {
        let isDaily = false;
        for (let j = 0; j < tasks[i].properties.Tags.multi_select.length; j++) {
            if (tasks[i].properties.Tags.multi_select[j].name === 'Morning' ||
                 tasks[i].properties.Tags.multi_select[j].name === 'Afternoon' ||
                tasks[i].properties.Tags.multi_select[j].name === 'Evening') {
                    if (tasks[i].properties.Checkbox.checkbox) {
                        console.log(`${tasks[i].properties.Name.title[0].plain_text} is suppost to be unchecked`);
                        return false;
                    } else {
                        isDaily = true;
                        break;
                    }
            }
        }
        if (!tasks[i].properties.Checkbox.checkbox && !isDaily) {
                    console.log(`${tasks[i].properties.Name.title[0].plain_text} is suppost to be checked`);
                    return false;
        }
    }
    return true;
}