import fs from 'fs';
import { join } from 'path';
import os from 'os';
import { Record, MemoruOptions } from './types';
import { Renderer } from './display';

export const defaultConfig: MemoruOptions = {
  showCompletedRecords: true,
  clearByDeletion: false,
  displayAfterOperation: true,
  inboxFile: join(os.homedir(), '.inbox.json'),
  configFile: join(os.homedir(), '.memoru.json'),
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

  Renderer.info(`Inbox file created at ${inboxFile}`);
  const inbox = fs.createWriteStream(inboxFile);
  inbox.write('[]');
  inbox.end();
  return [];
};

// If the config file does not exists, it writes the default options to it
export const readConfigFile = (defaultConfig: MemoruOptions): MemoruOptions => {

  if (!fileExists(defaultConfig.configFile)) {
    Renderer.info(`Config file created at ${defaultConfig.configFile}`);
    const inbox = fs.createWriteStream(defaultConfig.configFile, 'utf-8');
    inbox.write(JSON.stringify(defaultConfig, null, 2));
    inbox.end();
    return defaultConfig;
  }

  const buf: string = fs.readFileSync(defaultConfig.configFile, 'utf-8');
  const config: MemoruOptions = <MemoruOptions>JSON.parse(buf);

  return { ...defaultConfig, ...config };
};
