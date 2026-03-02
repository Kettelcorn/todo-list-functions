require('dotenv').config()

function main() {
    getData()
}

// Getting all tasks that have morning, afternoon, and evenining tags
async function getData(){
    let data_source = process.env.DATA_SOURCE;
    if (process.env.NODE_ENV == 'development') {
        data_source = process.env.TEST_DATA_SOURCE;
    }
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
    removeChecks(data);
}

// Uncheck all checkboxes for filtered tasks
async function removeChecks(tasks) {
    for (let i = 0; i < tasks.results.length; i++) {
        const response = await fetch(`https://api.notion.com/v1/pages/${tasks.results[i].id}`, {
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
        console.log(`Unchecked ${tasks.results[i].properties.Name.title[0].plain_text}, #${i}`);
    }
    hasMore(tasks);
}

// If tasks number exceeds 100, request next batch
async function hasMore(data){
    if (data.has_more) {
        let current_data = data;
        let has_more = data.has_more;
        while (has_more) {
            const response = await fetch(`https://api.notion.com/v1/data_sources/${process.env.TEST_DATA_SOURCE}/query`, {
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
            removeChecks(temp);
            if (temp.has_more) {
                current_data = temp;
            } else {
                has_more = false;
            }
        } 
    }
}

main();