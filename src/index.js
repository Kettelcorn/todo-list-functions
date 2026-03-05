require('dotenv').config()

async function main(data_source) {
    const filteredTasks = await getDailyTasks(data_source);
    return await removeChecks(filteredTasks);
}

// Getting all tasks that have morning, afternoon, and evenining tags
async function getDailyTasks(data_source){
    const response = await fetch(`https://api.notion.com/v1/data_sources/${data_source}/query`, {
    method: 'POST',
    headers: {
        'Authorization': `${process.env.NOTION_TOKEN}`,
        'Notion-Version': '2025-09-03',
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
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
    })
    });
    const data = await response.json();
    let tasks = [];
    for (let i = 0; i < data.results.length; i++) {
        tasks.push(data.results[i]);
    }
    const moreTasks = await hasMore(data, data_source)
    for (let i = 0; i < moreTasks.length; i++) {
        tasks.push(moreTasks[i]);
    }
    return tasks
}

// If tasks number exceeds 100, request next batch
async function hasMore(data, data_source){
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
                })
            });
            const temp = await response.json();
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

// Uncheck all checkboxes for filtered tasks
async function removeChecks(tasks) {
    console.log(`Removing checks from ${tasks.length} tasks`)
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
                        checkbox: false,
                    } 
                }
            })
        });
        const data = await response.json();
        console.log(`Unchecked ${tasks[i].properties.Name.title[0].plain_text}, #${i + 1}`);
    }
    console.log(`Removed checkboxes from ${tasks.length} tasks`);
    return true;
}

module.exports = { main }