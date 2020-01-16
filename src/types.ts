export enum recordState {
  NEXT = 'NEXT',
  WIP = 'WIP',
  SOMEDAY = 'SOMEDAY',
  WAITING = 'WAITING',
  DONE = 'DONE',
}

export interface Record {

  id: number;

  name: string;

  desc?: string;

  // It should default to NEXT
  state: string;

  startDate: Date;

  dueDate?: Date;

  // A name to group different records
  // The default context is INBOX
  context: string;

  // A list of tags to organize the records
  // Tags are represented by @tag
  // The default tag is @INBOX
  tags: string[];
}

// Fields passed by the user
export interface Fields {
  [field: string]: any;
}

export interface MemoruOptions {
  showCompletedRecords: boolean;
  clearByDeletion: boolean;
  displayAfterOperation: boolean;
  inboxFile: string;
  configFile: string;
}

// Group of all the command options passed to the command
export interface CommandOptions {
  // Whether to remove all done records from the list
  purgeRecords?: boolean;

  // Whether to delete the given records
  deleteRecords?: boolean;

  // Whether to hide the records that are done when displaying the list
  hideDoneRecords?: boolean;
}
