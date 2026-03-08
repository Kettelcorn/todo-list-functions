const test = require('node:test');
const assert = require('node:assert');
const app = require("../src/app.js");
const requests = require("../src/requests.js");
require('dotenv').config()
let data_source;

test('main test', async (t) => {
    await t.test('Adding checks to all tasks', async (t) => {
        data_source = await requests.getDataSourceId(process.env.TEST_DATA_URL)
        const tasks = await requests.getTasks(data_source, {});
        await requests.updateChecks(tasks, true);
        const checkedTasks = await requests.getTasks(data_source, {});
        assert.ok(allChecked(checkedTasks))
        const complete = await app.uncheckDaily(data_source);
        if (complete) {
            const updatedTasks = await requests.getTasks(data_source, {});
            assert.ok(onlyDailyUnchecked(updatedTasks))
        }
    });

    await t.test('Removing checks from daily tasks', async (t) => {
        data_source = await requests.getDataSourceId(process.env.TEST_DATA_URL)
        const complete = await app.uncheckDaily(data_source);
        if (complete) {
            const updatedTasks = await requests.getTasks(data_source, {});
            assert.ok(onlyDailyUnchecked(updatedTasks))
        }
    });

    await t.test('Update weekend tasks', async (t) => {
        const weekFilter = {
            filter: {
                property: 'Tags',
                multi_select: { contains: "Weekly" },
            }
        }
        data_source = await requests.getDataSourceId(process.env.TEST_DATA_URL)
        const filteredTasks = await requests.getTasks(data_source, weekFilter);
        const randomWeekly = await randomUpdateWeekly(filteredTasks, data_source)
        const originalTasks = await requests.getTasks(data_source, weekFilter);
        const complete = await app.updateWeekly(data_source);
        console.log(complete)
        const updatedTasks = await requests.getTasks(data_source, weekFilter);
        for (let i = 0; i < updatedTasks.length; i++) {
            if (originalTasks[i].properties.Number.number !== null && originalTasks[i].properties.Number.number !== 0) {
                assert.strictEqual(originalTasks[i].properties.Number.number, updatedTasks[i].properties.Number.number + 1);
            } else {
                if (originalTasks[i].properties.Checkbox.checkbox === true) {
                    assert.strictEqual(updatedTasks[i].properties.Number.number, 6);
                    assert.ok(updatedTasks[i].properties.Checkbox.checkbox);
                } else {
                    assert.ok(!updatedTasks[i].properties.Checkbox.checkbox)
                }
            }
            console.log(`${updatedTasks[i].properties.Name.title[0].plain_text} passed tests!`);
        }
    })
})

// Randomly assigns number and check values to weekly tasks to simulate a random day
async function randomUpdateWeekly(tasks, data_source) {
    for (let i = 0; i < tasks.length; i++) {
        let randomDays = getRandomInt(0, 7) - 1;
        let random;
        if (randomDays > 0) {
            random = true;
        } else {
            random = getRandomInt(0, 2) === 1;
        }
        if (randomDays === -1) {
            randomDays = null;
        } 
        try {
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
                            checkbox: random,
                        },
                        Number: {
                            number: randomDays,
                        }
                    }
                })
            });
            data = await response.json();
            console.log(`Assigned ${random} and ${randomDays} to ${tasks[i].properties.Name.title[0].plain_text}`);
        } catch (error) {
            console.error(error);
        }
    }
    return true;
}

// Generate random int
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Checks to see if all checkboxes for tasks passed in are checked
function allChecked(tasks) {
    for (let i = 0; i < tasks.length; i++) {
        if (!tasks[i].properties.Checkbox.checkbox) {
            console.log(`${tasks[i].properties.Name.title[0].plain_text} did not get checked`);
            return false;
        }
    } 
    return true;
}

// Checks to see if only daily tasks are only unchecked and not other tasks
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