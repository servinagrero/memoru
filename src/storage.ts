import fs from 'fs';
import { Record } from './types';

export interface MemoruOptions {
  showCompletedRecords: boolean;
  clearByDeletion: boolean;
  displayAfterOperation: boolean;
  inboxFile: string;
  configFile: string;
}

// Returns true if the given file exists
const fileExists = (file: string): boolean => {
  return fs.existsSync(file);
};

// Returns the list of stored records in the inbox file
// If the inbox file does not exists, it is created and
// an empty list is returned
export const readInboxFile = (inboxFile: string): Record[] => {

  if (fileExists(inboxFile)) {
    const buf: string = fs.readFileSync(inboxFile, 'utf-8');
    return <Record[]>JSON.parse(buf.toString());
  }

  const inbox = fs.createWriteStream(inboxFile);
  inbox.write('[]');
  inbox.end();
  return [];
};

// Returns the options stored in the configuration file
// If the file does not exists, it writes the default options to it
export const readConfigFile = (defaultConfig: MemoruOptions): MemoruOptions => {

  let config: MemoruOptions = defaultConfig;

  if (!fileExists(defaultConfig.configFile)) {
    const inbox = fs.createWriteStream(defaultConfig.configFile, 'utf-8');
    inbox.write(JSON.stringify(defaultConfig, null, 2));
    inbox.end();
    return defaultConfig;
  }

  const buf: string = fs.readFileSync(defaultConfig.configFile, 'utf-8');
  config = <MemoruOptions>JSON.parse(buf);

  if (!config.inboxFile) {
    config.inboxFile = defaultConfig.inboxFile;
  }
  if (!config.showCompletedRecords) {
    config.showCompletedRecords = defaultConfig.showCompletedRecords;
  }

  return config;
};
