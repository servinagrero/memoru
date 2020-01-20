<h1 align='center'>Memoru</h1>

<h3 align='center'>GTD projects from the terminal</h3>

<div align="center">
  <img alt="Capture" src="media/capture.png"/>
</div>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Description

Handle your GTD entries from the terminal. This tool allows to organize records in contexts and assign duedates to them. The tool allows for CRUD (**C**reate **R**ead **U**pdate **D**elete) The records are stored in a JSON file (on `~/Documents/inbox.json` by default ) to export to other tools.

Memoru can be customized by edditing the file `~/.memoru.json`

## Install

```bash
git clone https://github.com/servinagrero/memoru && cd memoru
npm i -g .
```

## Configuration

The edit the configuration options for memoru, edit `~/.memoru.json`.

+ `showCompletedRecords`: Show records marked as done
+ `clearByDeletion`: Delete a record from the list when is done
+ `displayAfterOperation`: Display the record list after every operation
+ `inboxFile`: The inbox file to read the records.

## Usage

A record has the required field: `name` and the optional fields: `desc`, `context`, `dueDate`,

## Create
To create a record pass the field of the record as `field:'Value'`. The only required field is the name. The rest can be updated later or added next to the name.

```bash
memoru -C name:'My awesome task' context:'Chores'
```

## Request

To display all records.
```bash
memoru -R
```

## Delete

To mark a record as DONE pass the id of the record. Multiple ids can be given as `id id...`.
To mark all records from a context pass the context name. The same works with tags in the form `@tag`.

```bash
memoru -D id
```

## Update

To update one record, pass the id and the updated fields. New fields get added to the record.
```bash
memoru -U id name:'New updated name'
```

## References

+ Heavily inspired by [Taskbook](https://github.com/klaussinani/taskbook)
+ [Chalk](https://github.com/chalk/chalk)
+ [yargs](https://github.com/yargs/yargs)

## WIP

+ Refactor and clean code
+ Solve problem with empty inbox file
+ Rendering modes for the request method
+ Chaining records
+ Custom colors
+ Add more config options
+ Write documentation
