import { recordDisplayer, infoDisplayer } from './display';

// The state for a record in any given time
export enum RecordState {
  NEXT = 'NEXT',
  SOMEDAY = 'SOMEDAY',
  WIP = 'WIP',
  WAITING = 'WAITING',
  PROJECT = 'PROJECT',
  DONE = 'DONE',
}

// Tickler represents some useful atachment to a record
interface Tickler {
  // A small description representing what the resource is
  desc?: string;

  // The resource points to the file or url
  resource: string;
}

// Record represents an entry
export interface Record {
  // Name representing the record
  name: string;

  // A small description to show besides the record
  desc?: string;

  // The state of the record
  // It should default to NEXT
  state: string;

  // Level of priority
  level: number;

  // In case the record needs to be completed before a given date
  dueDate?: Date;

  // A list of tags to organize the records
  // Tags are represented by @tag
  // The default tag is @inbox
  tags: string[];

  // A list of ticklers associated to the record
  ticklers?: Tickler[];
}

export interface MemoruOptions {
  showCompletedTodos: boolean;
  inboxFile: string;
}

export const defaultOptions: MemoruOptions = {
  showCompletedTodos: true,
  //   inboxFile: `${process.env.HOME}/inbox.json`,
  inboxFile: './inbox.json',
};

// Fields passed by the user
interface Fields {
  [field: string]: any;
}

export const createNewRecord = (args: Fields): Record => {
  const fields: Fields = {};

  args.map((f: string) => { fields[f.split(':')[0]] = f.split(':')[1]; });
  const newTodo: Record = fields as Record;

  if (!newTodo.name) {
    throw new Error('Record could not be created');
  } else {
    if (!newTodo.state) { newTodo.state = RecordState.NEXT; }
    if (!newTodo.tags) { newTodo.tags = []; newTodo.tags.push('@inbox'); }
  }

  return newTodo;
};

export const deleteRecord = (args: Fields, recordList: Record[]): Record[] => {
  const initialLength = recordList.length;
  let newList: Record[] = [];

  if (typeof (args[0]) === 'string') {
    // Delete records by tags
    newList = recordList.filter((e) => {
      return !args.some((t: string) => e.tags?.includes(t));
    });
  } else {
    // Delete records by id
    newList = recordList.filter((e, index) => { return !args.includes(index); });
  }

  if (newList.length === initialLength) {
    recordDisplayer.error('No records found.');
  } else {
    recordDisplayer.success('Records deleted sucsessfully');
  }

  return newList;
};

export const filterByTag = (tag: string[], recordList: Record[]): Record[] => {
  let newList: Record[] = [];
  newList = recordList.filter((e) => {
    return tag.some((t: string) => e.tags?.includes(t));
  });
  return newList;
}
