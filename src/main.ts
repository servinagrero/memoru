import * as yargs from 'yargs';
import { Memoru } from './record';

// Entry point of the program
const memoru = new Memoru();

const args = yargs
  .array('C')
  .array('D')
  .nargs('U', 1)
  .parse();

console.log(args);
memoru.handleRequest(args);
