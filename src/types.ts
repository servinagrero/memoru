// The state for a record in any given time
export enum RecordState {
  NEXT = 'NEXT',
  WIP = 'WIP',
  SOMEDAY = 'SOMEDAY',
  WAITING = 'WAITING',
  PROJECT = 'PROJECT',
  DONE = 'DONE',
}

// Tickler represents some useful atachment to a record
export interface Tickler {
  // A small description representing what the resource is
  desc?: string;

  // The resource points to the file or url
  resource: string;
}

// Record represents an entry
export interface Record {

  // Id for the record
  id: number;

  // Name representing the record
  name: string;

  // A small description to show besides the record
  desc?: string;

  // The state of the record
  // It should default to NEXT
  state: string;

  // Level of priority
  level: number;

  // When the record was created
  startDate: Date;

  // In case the record needs to be completed before a given date
  dueDate?: Date;

  // A list of tags to organize the records
  // Tags are represented by @tag
  // The default tag is @inbox
  tags: string[];

  // A list of ticklers associated to the record
  ticklers?: Tickler[];
}

// Fields passed by the user
export interface Fields {
  [field: string]: any;
}

// Group of all the command options passed to the command
export interface CommandOptions {
  // Whether to remove done records from the list
  purgeRecords?: boolean;

  // Whether to hide the records that are done when displaying the list
  hideDoneRecords?: boolean;
}
