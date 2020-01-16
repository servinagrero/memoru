import * as yargs from 'yargs';
import { Memoru } from './record';

const memoru = new Memoru();

const args = yargs
  .array('C')
  .array('D')
  .array('R')
  .array('U')
  .parse();

memoru.handleRequest(args);
