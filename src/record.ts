import * as fs from 'fs';
import chalk from 'chalk';
import { Renderer } from './display';
import { Record, recordState, Fields, MemoruOptions, CommandOptions } from './types';
import { readConfigFile, readInboxFile, defaultConfig } from './storage';

// Parse the command options for each operation
const getCommandOptions = (args: Fields): CommandOptions => {
  const options: CommandOptions = {};

  if (!args || Object.keys(args).length === 0) {
    return options;
  }

  // Only one of the options should be passed at any given time
  args.forEach((arg: any) => {
    if (typeof arg === 'string') {
      options.hideDoneRecords = arg.search(/h(ide)?/) !== -1;
      options.purgeRecords = arg.search(/p(urge)?/) !== -1;
      options.deleteRecords = arg.search(/d(elete)?/) !== -1;
    }
  });

  return options;
};

const dateDiffInDays = (start: Date, end: Date): number => {
  const msInDay: number = 86_400_000;

  // We need to convert the Date to a Date for some reason
  const msStart: number = new Date(start).getTime();
  const msEnd: number = new Date(end).getTime();

  return Math.round(Math.abs(msEnd - msStart) / msInDay);
};

const parseDate = (date: string): number => {
  const selector: string = date.slice(-1);
  const amount: number = parseInt(date.slice(0, -1), 10);

  interface Ratios { [sel:string]: number; }
  const ratios: Ratios = { d: 1, w: 7, m: 30, y: 365 };

  if (!ratios[selector]) {
    return amount;
  }

  return amount * ratios[selector];
};

// If the difference is negative the user has passed the dueDate
const daysUntilDueDate = (startDate: Date, args: string): Date => {
  const dueDate: Date = new Date();
  const daysOffset: number = parseDate(args);

  dueDate.setDate(startDate.getDate() + daysOffset);

  return dueDate;
};

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

const fieldsAsRecord = (args: Fields): Record => {
  const fields: Fields = {};
  args.map((field: string) => {
    const [key, value] = field.split(':');
    fields[key] = value;
  });
  return fields as Record;
};

export class Memoru {

  private recordList: Record[];

  private configOptions: MemoruOptions;

  public constructor(configOptions?: MemoruOptions) {

    this.configOptions = { ...readConfigFile(defaultConfig), ...configOptions };
    this.recordList = readInboxFile(this.configOptions.inboxFile);
  }

  // Returns false if no record satisfy the condition
  private markById(ids: number[], state: recordState): boolean {
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
  private markByTags(tags: string[], state: recordState): boolean {
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
  private markByContext(context: string, state: recordState): boolean {
    let found: boolean = false;

    this.recordList.map((e: Record) => {
      if (e.context.toUpperCase() === context.toUpperCase()) {
        e.state = state;
        found = true;
      }
    });
    return found;
  }

  private reassignIndexes() {
    this.recordList.forEach((record: Record, index) => {
      record.id = index;
    });
  }

  public createRecord(args: Fields): Record {

    const record: Record = fieldsAsRecord(args);

    if (!record.name) {
      throw new Error('Record has no name');
    }

    const defaultRecord = {
      startDate: new Date(),
      state: recordState.NEXT,
      context: 'Inbox',
      tags: ['@INBOX'],
    };

    if (record.dueDate) {
      record.dueDate = daysUntilDueDate(defaultRecord.startDate, record.dueDate.toString());
    }
    record.id = this.recordList.length;

    return { ...defaultRecord, ...record } as Record;
  }

  // If the option clearByDeletion is set to true, the record is removed from the list
  public clearRecords(args: any[]): void {
    if (this.recordList.length === 0) {
      Renderer.info('There are no records');
      return;
    }

    let found: boolean = false;
    const options: CommandOptions = getCommandOptions(args);

    if (options.purgeRecords) {
      this.purgeDoneRecords();
      return;
    }

    // FIXME: configOptions conflict with arguments passed by the user
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
        this.recordList = this.recordList.filter((record: Record) => {
          return !records.includes(record);
        });
      }

    } else {
      // TODO: Properly check for options
      if (typeof args[0] === 'string' && args[0].startsWith('@')) {
        found = this.markByTags(args, recordState.DONE);
      } else if (typeof args[0] === 'string') {
        found = this.markByContext(args[0], recordState.DONE);
      } else {
        found = this.markById(args, recordState.DONE);
      }
    }

    if (!found) {
      Renderer.error('No records found.');
    } else {
      Renderer.success('Records marked successfully');
      this.reassignIndexes();
    }
  }

  // Remove all records marked as done from the inbox file
  public purgeDoneRecords(): void {

    const initialLenth: number = this.recordList.length;

    this.recordList = this.recordList.filter((e: Record) => {
      return e.state !== recordState.DONE;
    });

    if (initialLenth === this.recordList.length) {
      Renderer.error('No records found.');
      return;
    }

    Renderer.warn('All done records have been purged.');
    this.reassignIndexes();
  }

  // FIXME: If there is a problem with the config options or an error during the
  // execution of the program the inbox file gets corrupted and the records are
  // lost.
  private writeRecordsToInboxFile(): void {
    const data: string = JSON.stringify(this.recordList, null, 2);
    fs.writeFileSync(this.configOptions.inboxFile, data, 'utf8');
  }

  // TODO: Improve this by refactoring and reducing code length
  public displayRecords(args: Fields): void {
    if (this.recordList.length === 0) {
      Renderer.info('There are no records');
      return;
    }

    const allContexts: string[] = [];

    this.recordList.forEach((e: Record) => {
      allContexts.push(e.context);
    });
    const contexts: string[] = [...new Set(allContexts)];

    contexts.forEach((context: string) => {
      const contextRecords: Record[] = filterByContext(this.recordList, context);
      const doneRecords: number = filterByState(contextRecords, recordState.DONE).length;

      // TODO: Allow the user to chose colors
      console.log(chalk`{redBright ${context}} [${doneRecords}/${contextRecords.length}]`);

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

        msg = chalk`${msg} {gray ${dateDiffInDays(r.startDate, new Date())}d}`;
        if (r.dueDate) {
          msg = chalk`${msg} {yellow ${dateDiffInDays(r.startDate, r.dueDate)}d}`;
        }
        console.log(msg);

        if (r.desc && r.desc !== '') {
          console.log(`     ${chalk.italic(r.desc)}`);
        }

      });

    });
  }

  // It needs the record id and the new parameters
  public updateRecord(fields: Fields): void {

    const id: number = fields.shift();

    if (!this.recordList[id]) {
      Renderer.error('No record found.');
      return;
    }

    const createRecord: Record = fieldsAsRecord(fields);
    this.recordList[id] = { ...this.recordList[id], ...createRecord } as Record;

    Renderer.success('Record updated successfully');

  }

  // TODO: Handle ussage message
  // TODO: Arg to dump current config values
  public handleRequest(args: Fields): void {
    if (args.C) {
      try {
        const record: Record = this.createRecord(args.C);
        this.recordList.push(record);
      } catch (e) {
        Renderer.error(e.message);
      }

    } else if (args.R) {
      this.displayRecords(args.R);

    } else if (args.U) {
      this.updateRecord(args.U);

    } else if (args.D) {
      this.clearRecords(args.D);
    }

    this.writeRecordsToInboxFile();

    if (this.configOptions.displayAfterOperation && !args.R) {
      this.displayRecords({});
    }
  }
}
