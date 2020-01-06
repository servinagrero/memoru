<h1 align='center'>Memoru</h1>

<h3 align='center'>GTD projects from the termnal</h3>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Description
CLI tool to handle your GTD records in a breeze.

The tool allows for CRUD (**C**reate **R**ead **U**pdate **D**elete)

The records are stored in a JSON file (on `~/Documents/inbox.json` by default ) to export to other tools.

Options are read from the file `~/.memoru.json`

## Install

```bash
npm install memoru
```
## Usage

To create a record
```bash
memoru -C name:'My awesome task'
```

More than one field can be passed at the same time

```bash
memoru -C name:'My awesome task' desc:'My description' tags:@lazy
```
## References

+ [GTD startguide](https://hamberg.no/gtd/)
+ Heavily inspired by [Taskbook](https://github.com/klaussinani/taskbook)

## Libraries

+ [Signale](https://github.com/klaussinani/signale)
+ [yargs](https://github.com/yargs/yargs)
