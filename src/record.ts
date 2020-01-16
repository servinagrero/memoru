import * as fs from 'fs';
import { join } from 'path';
import * as os from 'os';
import chalk from 'chalk';
import { Renderer } from './display';
import { Record, recordState, Fields, MemoruOptions, CommandOptions } from './types';
import { readConfigFile, readInboxFile, defaultConfig } from './storage';

// Parse the command options for each operation
const parseCommandOptions = (args: Fields): CommandOptions => {
  const options: CommandOptions = {};

  if (!args || Object.keys(args).length === 0) {
    return {};
  }

  if (typeof args === 'boolean' || typeof args[0] === 'number') {
    return {};
  }

  options.hideDoneRecords = args.some((c: string) => {
    return c === 'hide' || c === 'h';
  });
  options.purgeRecords = args.some((c: string) => {
    return c === 'purge' || c === 'p';
  });
  options.deleteRecords = args.some((c: string) => {
    return c === 'delete' || c === 'd';
  });

  return options;
};

const timeDiff = (start: Date, end: Date): number => {
  const msInDay: number = 1000 * 60 * 60 * 24;

  // We need to convert the Date to a Date for some reason
  const msStart: number = new Date(start).getTime();
  const msEnd: number = new Date(end).getTime();

  return Math.round(Math.abs(msEnd - msStart) / msInDay);
};

// TODO: Allow filtering by regexp
const filterById = (records: Record[], ids: number[]): Record[] => {
  return records.filter((e: Record) => {
    return ids.includes(e.id);
  });
};

const filterByTag = (records: Record[], tags: string[]): Record[] => {
  return records.filter((e: Record) => {
    return tags.some((t: string) => e.tags.includes(t.toUpperCase()));
  });
};

const filterByState = (records: Record[], state: recordState): Record[] => {
  return records.filter((e: Record) => {
    return e.state === state;
  });
};

const filterByContext = (records: Record[], context: string): Record[] => {
  return records.filter((e: Record) => {
    return e.context.toUpperCase() === context.toUpperCase();
  });
};

// Data is entered by the user as 'key:value'
const fieldsAsRecord = (args: Fields): Record => {
  const fields: Fields = {};
  args.map((f: string) => {
    fields[f.split(':')[0]] = f.split(':')[1];
  });
  return fields as Record;
};

export class Memoru {

  private recordList: Record[];

  private configOptions: MemoruOptions;

  public constructor(recordList?: Record[], configOptions?: MemoruOptions) {
    if (configOptions) {
      this.configOptions = configOptions;
    } else {
      this.configOptions = readConfigFile(defaultConfig);
    }

    if (recordList) {
      this.recordList = recordList;
    } else {
      this.recordList = readInboxFile(this.configOptions.inboxFile);
    }
  }

  // Returns false if no record satisfy the condition
  private markRecordsById(ids: number[], state: recordState): boolean {
    let found: boolean = false;
    this.recordList.map((record: Record) => {
      if (ids.includes(record.id)) {
        record.state = state;
        found = true;
      }
    });
    return found;
  }

  // Returns false if no record satisfy the condition
  private markRecordsByTags(tags: string[], state: recordState): boolean {
    let found: boolean = false;
    this.recordList.map((record: Record) => {
      const recordInTag: boolean = tags.some((t: string) => {
        record.tags.includes(t.toUpperCase());
      });
      if (recordInTag) {
        record.state = state;
        found = true;
      }
    });
    return found;
  }

  // Returns false if no records are found
  private markRecordsByContext(context: string, state: recordState): boolean {
    let found: boolean = false;

    this.recordList.map((e: Record) => {
      if (e.context === context) {
        e.state = state;
        found = true;
      }
    });
    return found;
  }

  public newRecord(args: Fields): Record {

    const record: Record = fieldsAsRecord(args);

    const defaultRecord = {
      id: this.recordList.length,
      startDate: new Date(),
      state: recordState.NEXT,
      context: 'Inbox',
      tags: ['@INBOX'],
    };

    if (!record.name) {
      throw new Error('Record has no name');
    }

    return { ...defaultRecord, ...record } as Record;
  }

  public createRecord(args: Fields): void {
    try {
      const record: Record = this.newRecord(args);
      this.recordList.push(record);
      Renderer.success('Record added sucsessfully');
    } catch (e) {
      Renderer.error(e.message);
    }
  }

  // If the option clearByDeletion is set to true, the record is removed from the list
  public clearRecords(args: any[]): void {
    let found: boolean = false;
    const options: CommandOptions = parseCommandOptions(args);

    if (options.purgeRecords) {
      this.purgeDoneRecords();
      return;
    }

    if (options.deleteRecords || this.configOptions.clearByDeletion) {
      let records: Record[];
      if (typeof args[1] === 'string' && args[1].startsWith('@')) {
        records = filterByTag(this.recordList, args);
      } else if (typeof args[1] === 'string') {
        records = filterByContext(this.recordList, args[1]);
      } else {
        records = filterById(this.recordList, args.slice(1));
      }

      found = records.length > 0;
      if (found) {
        this.recordList = this.recordList.filter((e: Record) => !records.includes(e));
      }

    } else {
      // TODO: Properly check for options
      if (typeof args[0] === 'string' && args[0].startsWith('@')) {
        found = this.markRecordsByTags(args, recordState.DONE);
      } else if (typeof args[0] === 'string') {
        found = this.markRecordsByContext(args[0], recordState.DONE);
      } else {
        found = this.markRecordsById(args, recordState.DONE);
      }
    }

    if (!found) {
      Renderer.error('No records found.');
    } else {
      Renderer.success('Records marked sucsessfully');
    }
  }

  // Remove all records marked as done from the inbox file
  public purgeDoneRecords(): void {
    if (this.recordList.length === 0) {
      Renderer.info('There are no records');
      return;
    }

    const initialLenth: number = this.recordList.length;

    this.recordList = this.recordList.filter((e: Record) => {
      return e.state !== recordState.DONE;
    });

    if (initialLenth === this.recordList.length) {
      Renderer.error('No records found.');
      return;
    }

    // Reassing the ids to the records
    this.recordList.forEach((e, index) => {
      e.id = index;
    });

    this.writeRecordsToInboxFile();
    Renderer.warn('All done records have been purged.');
  }

  private writeRecordsToInboxFile(): void {
    const inbox = fs.createWriteStream(this.configOptions.inboxFile);
    inbox.write(JSON.stringify(this.recordList, null, 2));
    inbox.end();
  }

  // TODO: Improve this by refactoring and reducing code length
  // TODO: Output more attributes of a record
  public displayRecords(args: Fields): void {
    if (this.recordList.length === 0) {
      Renderer.info('There are no records');
      return;
    }

    const allContexts: string[] = [];
    const options: CommandOptions = parseCommandOptions(args);
    const stdout = process.stdout;

    this.recordList.forEach((e: Record) => {
      allContexts.push(e.context);
    });
    const contexts: string[] = [...new Set(allContexts)];

    contexts.forEach((context: string) => {
      const contextRecords: Record[] = filterByContext(this.recordList, context);
      const doneRecords: number = filterByState(contextRecords, recordState.DONE).length;

      // TODO: Allow the user to chose colors
      stdout.write(chalk`{redBright ${context}} `);
      stdout.write(chalk`[${doneRecords}/${contextRecords.length}]\n`);

      contextRecords.forEach((r: Record) => {
        let msg: string = '';
        msg = chalk`  {gray ${r.id}.}`;
        switch (r.state) {
          case recordState.WIP:
          case recordState.NEXT: {
            msg = chalk`${msg} {white ${r.name}}`;
            break;
          }
          case recordState.DONE: {
            msg = chalk`${msg} {greenBright ${r.name}}`;
            break;
          }
          case recordState.SOMEDAY:
          case recordState.WAITING: {
            msg = chalk`${msg} {yellow ${r.name}}`;
            break;
          }
        }

        msg = chalk`${msg} {gray ${timeDiff(r.startDate, new Date())}d}`;

        console.log(msg);
      });
    });
  }

  // It needs the record id and the new parameters
  public updateRecords(args: Fields): void {
    if (typeof args[0] !== 'number') {
      Renderer.error('No record id given.');
      return;
    }

    const id: number = args.shift();
    if (id > this.recordList.length || id < 0) {
      Renderer.error('No records found.');
      return;
    }

    const newRecord: Record = fieldsAsRecord(args);
    this.recordList[id] = { ...this.recordList[id], ...newRecord } as Record;

    Renderer.success('Records updated sucsessfully');

  }

  public handleRequest(args: Fields): void {
    if (args.C) {
      this.createRecord(args.C);
    } else if (args.R) {
      this.displayRecords(args.R);
    } else if (args.U) {
      this.updateRecords(args.U);
    } else if (args.D) {
      this.clearRecords(args.D);
    }

    this.writeRecordsToInboxFile();

    if (this.configOptions.displayAfterOperation && !args.R) {
      this.displayRecords({});
    }
  }
}
