import { exec as execChildProcess } from 'child_process';

export function exec(command: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    execChildProcess(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}
