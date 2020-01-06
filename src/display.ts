// import * as signale from 'signale';
const signale = require('signale');

const recordOptions = {
  disabled: false,
  interactive: false,
  logLevel: 'info',
  scope: '',
  secrets: [],
  stream: process.stdout,
  types: {
    next: {
      badge: '->',
      color: 'blue',
      label: '',
      logLevel: 'info',
    },
    done: {
      badge: '✔',
      color: 'greenBright',
      label: '',
      logLevel: 'info',
    },
  },
};

const options = {
  disabled: false,
  interactive: false,
  logLevel: 'info',
  scope: '',
  secrets: [],
  stream: process.stdout,
  types: {
    next: {
      badge: '',
      color: 'gray',
      label: '',
      logLevel: 'info',
    },
  },
};

signale.config({
  displayScope: true,
  displayBadge: true,
  displayDate: false,
  displayFilename: false,
  displayLabel: true,
  displayTimestamp: false,
  underlineLabel: false,
  underlineMessage: false,
  underlinePrefix: false,
  underlineSuffix: false,
  uppercaseLabel: false,
});

// signale.success('Hello from the Global scope');
export namespace Renderer {
  export const recordDisplayer = new signale.Signale(recordOptions);
  export const infoDisplayer = new signale.Signale(options);
}
