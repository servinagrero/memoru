import * as fs from 'fs';
import { join } from 'path';
import os from 'os';
import { Record, MemoruOptions } from './types';
import { Renderer } from './display';

const CONFIG_FILE: string =  join(os.homedir(), '.memoru.json');

export const defaultConfig: MemoruOptions = {
  showCompletedRecords: true,
  clearByDeletion: false,
  displayAfterOperation: true,
  inboxFile: join(os.homedir(), '.inbox.json'),
};

const fileExists = (file: string): boolean => {
  return fs.existsSync(file);
};

// If the inbox file does not exists, it is created and an empty list is returned
export const readInboxFile = (inboxFile: string): Record[] => {

  if (fileExists(inboxFile)) {
    const buf: string = fs.readFileSync(inboxFile, 'utf-8');
    return <Record[]>JSON.parse(buf.toString());
  }

  fs.writeFileSync(inboxFile, '[]', 'utf8');
  Renderer.info(`Inbox file created at ${inboxFile}`);
  return [];
};

// If the config file does not exists, it writes the default options to it
export const readConfigFile = (defaultConfig: MemoruOptions): MemoruOptions => {

  if (!fileExists(CONFIG_FILE)) {
    const data: string = JSON.stringify(defaultConfig, null, 4);
    fs.writeFileSync(CONFIG_FILE, data, 'utf8');
    Renderer.info(`Config file created at ${CONFIG_FILE}`);
    return defaultConfig;
  }

  const buf: string = fs.readFileSync(CONFIG_FILE, 'utf-8');
  const config: MemoruOptions = <MemoruOptions>JSON.parse(buf);

  if (config.inboxFile.startsWith('~')) {
    config.inboxFile = config.inboxFile.replace('~', os.homedir());
  }

  return { ...defaultConfig, ...config };
};
