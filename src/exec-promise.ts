import { exec as execChildProcess } from 'child_process';

export interface Options{
  throwOnCode?: (code: number) => boolean;
}

const defaultOptions: Options ={
  throwOnCode: (code: number) => false,
};

export const nonZeroCode = (code: number) => code !== 0;
export const neverThrow = (_: number) => false;

export function execAsync(dir: string, command: string, options?: Options): Promise<string> {
  const optionsToUse = { ...defaultOptions, ...options };

  return new Promise<string>((resolve, reject) => {
    execChildProcess(command, { cwd: dir }, (error, stdout, stderr) => {
      if (error && error.code && optionsToUse?.throwOnCode?.(error.code)) {
        reject(JSON.stringify({ error }));
      } else {
        resolve(stdout);
      }
    });
  });
}
