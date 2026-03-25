const test = require('node:test');
const assert = require('node:assert');
const app = require("../src/app.js");
const requests = require("../src/requests.js");
require('dotenv').config()
let data_source;

test('main test', async (t) => {
    await t.test('Removing checks from daily tasks', async (t) => {
        data_source = await requests.getDataSourceId(process.env.TEST_DATA_URL)
        const tasks = await requests.getTasks(data_source, requests.generateFilter(true, [
            "Daily"
        ]));
        if (tasks.length < 205) {
            console.log("Not enough tasks")
            const uncheckedDaily = await requests.getTasks(data_source, requests.generateFilter(false, [
                "Daily"
            ]))
            const limitedTasks = uncheckedDaily.splice(0, 205 - tasks.length);
            await requests.updateChecks(limitedTasks, true);
        }
        const complete = await app.uncheckDaily(data_source);
        if (complete) {
            const updatedTasks = await requests.getTasks(data_source, requests.generateFilter(null, [
            "Daily"
        ]));
            assert.ok(allUnchecked(updatedTasks))
        }
    });

    await t.test('Update recurring tasks', async (t) => {
        const recurringFilter = requests.generateFilter(null, [
            "Every other day",
            "Semiweekly",
            "Weekly",
            "Biweekly",
            "Monthly",
            "Semiannually",
            "Yearly"
        ])
        if (data_source == null) {
            data_source = await requests.getDataSourceId(process.env.TEST_DATA_URL)
        }
        const filteredTasks = await requests.getTasks(data_source, recurringFilter);
        const randomUpdateRecurring = await randomUpdate(filteredTasks.splice(0, 50));
        const originalTasks = await requests.getTasks(data_source, recurringFilter);
        const complete = await app.updateRecurring(data_source);
        const updatedTasks = await requests.getTasks(data_source, recurringFilter);
        for (let i = 0; i < updatedTasks.length; i++) {
            if (originalTasks[i].properties.Number.number !== null && originalTasks[i].properties.Number.number !== 0) {
                assert.strictEqual(updatedTasks[i].properties.Number.number, originalTasks[i].properties.Number.number - 1);
                if (originalTasks[i].properties.Number.number == 1) {
                    assert.ok(!updatedTasks[i].properties.Checkbox.checkbox);
                }
            } else {
                if (originalTasks[i].properties.Checkbox.checkbox === true) {
                    assert.strictEqual(updatedTasks[i].properties.Number.number, requests.getDayCount(updatedTasks[i]) - 1);
                    assert.ok(updatedTasks[i].properties.Checkbox.checkbox);
                } else {
                    assert.ok(!updatedTasks[i].properties.Checkbox.checkbox);
                }
            }
        }
    });

    await t.test('Move checked backlog tasks to trash', async (t) => {
        if (data_source == null) {
            data_source = await requests.getDataSourceId(process.env.TEST_DATA_URL)
        }
        const backlogFilter = requests.generateFilter(null, [
            "Backlog"
        ]);
         const tasks = await requests.getTasks(data_source, backlogFilter);
        if (tasks.length != 0) {
            let checked = [];
            for (let i = 0; i < tasks.length; i++) {
                if (tasks[i].properties.Checkbox.checkbox) {
                    checked.push(tasks[i]);
                }
            }
            if (checked.length == 0) {
                checked = tasks.splice(0, 1)
                await requests.updateChecks(checked, true)
            }
            const complete = await app.trashCheckedBacklog(data_source);
            if (complete) {
                const updatedTasks = await requests.getTasks(data_source, backlogFilter);
                for (let i = 0; i < checked.length; i++) {
                    for (let j = 0; j < updatedTasks.length; j++) {
                        if (checked[i].id === updatedTasks[j].id) {
                            assert.ok(updatedTasks[j].in_trash)
                        }
                    }
                }
                for (let i = 0; i < updatedTasks.length; i++) {
                    if (!updatedTasks[i].in_trash) {
                        assert.ok(!updatedTasks[i].properties.Checkbox.checkbox)
                    } else {
                        assert.ok(updatedTasks[i].properties.Checkbox.checkbox)
                    }
                }
            }
        } else {
            //TODO: Create function to create a task for testing purposes, for now just print statement saying need backlog tasks
            console.log("Currently no backlog tasks to test on");
            assert.strictEquals("You need", "Backlog tasks (:");
        }
    });
})

// Randomly assigns number and check values to weekly tasks to simulate a random day
async function randomUpdate(tasks) {
    let results = []
    console.log(`Randomly updating ${tasks.length} tasks...`)
    for (let i = 0; i < tasks.length; i++) {
        let randomDays = getRandomInt(0, requests.getDayCount(tasks[i])) - 1;
        let random;
        if (randomDays > 0) {
            random = true;
        } else {
            random = getRandomInt(0, 1) === 1;
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
            results.push(data);
            console.log(`Assigned ${random} and ${randomDays} to ${tasks[i].properties.Name.title[0].plain_text} (${i + 1})`);
        } catch (error) {
            console.error(error);
        }
    }
    return results;
}

// Generate random int
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Checks to see if only daily tasks are only unchecked and not other tasks
function allUnchecked(tasks) {
    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].properties.Checkbox.checkbox) {
            console.log(`${tasks[i].properties.Name.title[0].plain_text} is suppost to be unchecked`);
            return false;
        }
    }
    return true;
}