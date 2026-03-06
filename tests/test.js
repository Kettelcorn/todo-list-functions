const test = require('node:test');
const assert = require('node:assert');
const app = require("../src/app.js");
require('dotenv').config()
let data_source;


test('Test removing checkmarks from daily tasks', async (t) => {
    data_source = await app.getDataSourceId(process.env.TEST_DATA_URL)
    const tasks = await app.getTasks(data_source, {});
    await app.updateChecks(tasks, true);
    const checkedTasks = await app.getTasks(data_source, {});
    assert.ok(allChecked(checkedTasks))
    const complete = await app.main(data_source);
    if (complete) {
        const updatedTasks = await app.getTasks(data_source, {});
        assert.ok(onlyDailyUnchecked(updatedTasks))
    }
});



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