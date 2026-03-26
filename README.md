# todo-list-functions [![Node.js CI](https://github.com/Kettelcorn/todo-list-functions/actions/workflows/node.js.yml/badge.svg)](https://github.com/Kettelcorn/todo-list-functions/actions/workflows/node.js.yml)

A personal project developing todo-list automations for my personal list. It utilizes cron jobs in order to schedule Node.js scripts to get data from my list and update it.

---

## Requirements

- Node.js (24.x)
- Notion account
- Notion database with integrations set up

---

## Install

    $ git clone https://github.com/Kettelcorn/todo-list-functions.git
    $ cd todo-list-functions
    $ npm install

## Configure app

Inside the root directory of the project, create a `.env` file with the following values

```
NOTION_TOKEN=
DATA_SOURCE=
TEST_DATA_SOURCE=
NODE_ENV=

```

- Notion Token: Internal integration secret that is connected to your database
- Data Source: The id for your database's datasource
- Test Data Source: The id for your test database's datasource
- Node env: Used to indicate if in development or production environments, either 'development' or 'production'

## Running the project

    $ npm run dev

## Simple build for production

    $ npm run prod
