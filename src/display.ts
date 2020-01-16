import chalk from 'chalk';

export namespace Renderer {
  export const error = (msg: string) => {
    console.log(chalk`{red x} ${msg}`);
  };

  export const warn = (msg: string) => {
    console.log(chalk`{redBright !} ${msg}`);
  };

  export const info = (msg: string) => {
    console.log(chalk`{yellow !} ${msg}`);
  };

  export const success = (msg: string) => {
    console.log(chalk`{green +} ${msg}`);
  };
}
