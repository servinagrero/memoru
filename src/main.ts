import * as yargs from 'yargs';
import fs from 'fs';
import { Record, RecordState, createNewRecord, MemoruOptions,
         defaultOptions, deleteRecord, filterByTag } from './record';
import { recordDisplayer, infoDisplayer } from './display';
import chalk from 'chalk';

const configFile: string = `${process.env.HOME}/.memoru.json`;

interface Request {
  C: string;
  R: boolean | string;
  U: string | number;
  D: string | number;
}

// Write the given list of todos to the inbox file
const writeToFile = (file: string, todos: Record[]): void => {
  const inbox = fs.createWriteStream(file);
  inbox.write(JSON.stringify(todos, null, 2));
  inbox.end();
};

// Read the config file
// Assign default values in case they are empty
const readConfig = (): MemoruOptions => {
  const buf: string = fs.readFileSync(configFile, 'utf-8');
  const config: MemoruOptions = JSON.parse(buf);

  if (!config.inboxFile) { config.inboxFile = defaultOptions.inboxFile; }
  if (!config.showCompletedTodos) { config.showCompletedTodos = defaultOptions.showCompletedTodos; }

  return config;
};

// The output for a tag should be
//
// @tag [completed/total] x done x pending
//  1. ->  Name
//  2. ✔  Name
//
//  x% of tasks completed
const displayRecords = (records: Record[]): void => {
  const stdout = process.stdout;

  let allTags: string[] = [];
  records.forEach((e) => {
    allTags = allTags.concat(e.tags);
  });
  const tags: string[] = [...new Set(allTags)];

  let offset: number = 0;
  tags.forEach((tag: string) => {
    const tagRecords: Record[] = filterByTag([tag], records);
    const doneRecords = tagRecords.filter((e) => { return e.state === RecordState.DONE; }).length;

    stdout.write(chalk`{redBright ${tag}} [${doneRecords}/${tagRecords.length}]  `);
    stdout.write(chalk`{blueBright ${doneRecords}} {gray done} {magenta ${tagRecords.length - doneRecords}} {gray pending}\n`);

    tagRecords.forEach((r, index) => {
      switch (r.state) {
        case RecordState.NEXT: {
          recordDisplayer.next({ prefix: `${index + offset}.`, message: r.name });
          break;
        }
        case RecordState.DONE: {
          recordDisplayer.done({ prefix: `${index + offset}.`, message: r.name });
          break;
        }
      }
    });
    stdout.write('\n');
    offset += tagRecords.length;
  });
};

const args = yargs
  .array('C')
  .array('D')
  .nargs('U', 1)
  .parse();

const memoruOptions = readConfig();
// console.log(memoruOptions);
// infoDisplayer.error('Custom error');
// infoDisplayer.complete({ prefix: '[task]', message: 'Fix issue #59', suffix: '(@klauscfhq)' });

// Handle the CRUD request
const handleRequest = (args: any, recordList: Record[]): void => {
  let newList: Record[] = recordList;

  if (args.C) {
    try {
      const newRecord: Record = createNewRecord(args.C);
      newList.push(newRecord);
      recordDisplayer.success('Record added sucsessfully');
    } catch (err) {
      infoDisplayer.error(err.message);
    }
  } else if (args.R) {
    displayRecords(newList);
  } else if (args.U) {

  } else if (args.D) {
    newList = deleteRecord(args.D, recordList);
  }

  writeToFile(memoruOptions.inboxFile, newList);
};

// Entry point of the program
fs.readFile(memoruOptions.inboxFile, (err, buf) => {
  if (err) { throw (err); }

  const recordList: Record[] = JSON.parse(buf.toString());
  handleRequest(args, recordList);
});
