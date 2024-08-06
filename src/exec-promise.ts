import { exec as execChildProcess } from 'child_process';

export interface Options {
  env?: NodeJS.ProcessEnv;
  cwd?: string;
  throwOnCode?: (code: number) => boolean;
}

const defaultOptions: Options = {
  env: undefined,
  cwd: undefined,
  throwOnCode: (code: number) => false,
};

export const nonZeroCode = (code: number) => code !== 0;
export const neverThrow = (_: number) => false;

// TODO: FIXME: the `execAsync` and `execAsyncFor` methods may be contributing to BSODs.
// Maybe having a limit on how many processes are spawened at once is going to help avoiding BSODs.

export async function execAsyncFor<T>(command: string, options?: Options): Promise<T> {
  return JSON.parse(await execAsync(command, options));
}

export function execAsync(command: string, options?: Options): Promise<string> {
  const { cwd, env, throwOnCode } = { ...defaultOptions, ...options };

  return new Promise<string>((resolve, reject) => {
    execChildProcess(
      command,
      { cwd, env },
      (error, stdout, stderr) => {
        if (error && error.code && throwOnCode?.(error.code)) {
          reject(JSON.stringify({ error }));
        } else {
          resolve(stdout);
        }
      },
    );
  });
}
