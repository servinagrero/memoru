import * as fs from 'fs';
import { join } from 'path';
import * as os from 'os';
import chalk from 'chalk';
import { Renderer } from './display';
import { Record, RecordState, Tickler, Fields, CommandOptions } from './types';
import { readConfigFile, readInboxFile, MemoruOptions } from './storage';

// Parse the command options for each operation
const parseCommandOptions = (args: Fields): CommandOptions => {
  return {};
};

// Class to handle all records
export class Memoru {

  private defaultConfig: MemoruOptions = {
    showCompletedRecords: true,
    clearByDeletion: false,
    displayAfterOperation: true,
    inboxFile: join(os.homedir(), '.inbox.json'),
    configFile: join(os.homedir(), '.memoru.json'),
  };

  private recordList: Record[];

  private configOptions: MemoruOptions;

  public constructor(recordList?: Record[], configOptions?: MemoruOptions) {

    if (configOptions) {
      this.configOptions = configOptions;
    } else {
      this.configOptions = readConfigFile(this.defaultConfig);
    }

    if (recordList) {
      this.recordList = recordList;
    } else {
      this.recordList = readInboxFile(this.configOptions.inboxFile);
    }
  }

  // Returns a list of records that contain the given tags
  public filterByTag(tags: string[]): Record[] {
    return this.recordList.filter((e) => {
      return tags.some((t: string) => e.tags?.includes(t));
    });
  }

  // Create a new record based on user input
  // A new record must have at least a name
  // Some fields get a default value
  public createNewRecord(args: Fields): void {
    const fields: Fields = {};

    args.map((f: string) => { fields[f.split(':')[0]] = f.split(':')[1]; });
    const newRecord: Record = fields as Record;

    if (!newRecord.name) {
      Renderer.recordDisplayer.error('Record could not be created');
      return;
    }

    newRecord.id = this.recordList.length;
    newRecord.startDate = new Date();
    if (!newRecord.state) { newRecord.state = RecordState.NEXT; }
    if (!newRecord.tags) { newRecord.tags = ['@inbox']; }
    if (!newRecord.level) { newRecord.level = 0; }

    this.recordList.push(newRecord);
    Renderer.recordDisplayer.success('Record added sucsessfully');
  }

  // Mark a record as DONE
  // This does not remove it from the list unless the option
  // clearByDeletion is set to true
  // TODO: Delete the record if clearByDeletion is true
  public clearRecord(args: any[]): void {
    const initialLength = this.recordList.length;
    let found: boolean = false;

    if (typeof (args[0]) === 'string') {
      this.recordList.map((record: Record) => {
        const recordInTag: boolean = args.some((t: string) => record.tags?.includes(t));
        if (recordInTag) {
          record.state = RecordState.DONE;
          found = true;
        }
      });
    } else {
      this.recordList.map((record) => {
        if (args.includes(record.id)) {
          record.state = RecordState.DONE;
          found = true;
        }
      });
    }

    // TODO: Improve error message by giving more information
    if (!found) {
      Renderer.recordDisplayer.error('No records found.');
    } else {
      Renderer.recordDisplayer.success('Records deleted sucsessfully');
    }

  }

  // Remove the records marked as done from the inbox file
  public removeDoneRecords(): void {
    this.recordList = this.recordList.filter((e) => {
      return e.state !== RecordState.DONE;
    });

    this.writeRecordsToInboxFile();
  }

  // Write all records to the inbox file
  private writeRecordsToInboxFile(): void {
    const inbox = fs.createWriteStream(this.configOptions.inboxFile);
    inbox.write(JSON.stringify(this.recordList, null, 2));
    inbox.end();
  }

  // Display all records in an elegant and useful way
  // TODO: Improve this by refactoring and reducing code length
  // TODO: Output more attributs of a record
  public displayRecords(args: Fields): void {

    let hideDoneRecords: boolean = false;

    if (args && typeof args !== 'boolean') {
      hideDoneRecords = args.match('hide') !== null;
    }

    const stdout = process.stdout;

    let allTags: string[] = [];
    this.recordList.forEach((record) => {
      allTags = allTags.concat(record.tags);
    });
    const tags: string[] = [...new Set(allTags)];

    // tags.map((tag) => { pretyPrint(tag, this.recordList); }) could be better ??
    tags.forEach((tag: string) => {
      const tagRecords: Record[] = this.filterByTag([tag]);
      const doneRecords = tagRecords.filter((record) => {
          return record.state === RecordState.DONE;
      }).length;

      stdout.write(chalk`{redBright ${tag}} [${doneRecords}/${tagRecords.length}]  `);
      stdout.write(chalk`{blueBright ${doneRecords}} {gray done} {magenta ${tagRecords.length - doneRecords}} {gray pending}\n`);

      tagRecords.forEach((r, index) => {
        switch (r.state) {
          case RecordState.NEXT: {
            Renderer.recordDisplayer.next({ prefix: `${r.id}.`, message: r.name });
            break;
          }
          case RecordState.DONE: {
            if (this.configOptions.showCompletedRecords && !hideDoneRecords) {
              Renderer.recordDisplayer.done({ prefix: `${r.id}.`, message: r.name });
              break;
            }
          }
        }
      });
      stdout.write('\n');
    });
  }

  // Update a record based on new values given by the user
  // TODO: Create this function
  public updateRecord(args: Fields): void {
    return;
  }

  public handleRequest(args: Fields): void {
    if (args.C) {
      this.createNewRecord(args.C);
    } else if (args.R) {
      this.displayRecords(args.R);
    } else if (args.U) {
      this.updateRecord(args.U);
    } else if (args.D) {
      this.clearRecord(args.D);
    }

    this.writeRecordsToInboxFile();

    if (this.configOptions.displayAfterOperation) {
      this.displayRecords({});
    }
  }
}
