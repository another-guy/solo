export interface CliCommandMetadata {
  name: string;
  description: string;
  options: CliOptionsSet;
  impl: (this: any, str: any, options: any) => Promise<void>;
}

export interface CliOptionsSet {
  [_: string]: CliOption;
}

export interface CliOption {
  short?: string;
  long: string;
  codeName: string;
  description: string;
  exampleValue?: string;
  defaultValue?: string;
}

export function describeCliOption(option: CliOption): [string, string] {
  const { short, long, codeName, description } = option;
  return [`${short ? `-${short}, ` : ''}--${long} <${codeName}>`, description];
}

export const optionsToExamples = (options: CliOptionsSet) =>
  Object
    .values(options)
    .map(provideCliOptionExample)
    .join(' ');

export function provideCliOptionExample(option: CliOption): string {
  const { short, long, exampleValue } = option;
  return `${short ? `-${short}` : `--${long}`} ${exampleValue || ''}`;
}

export function createCommandExample(commandMetadata: CliCommandMetadata): string {
  return `$ npm start -- ${commandMetadata.name} ${optionsToExamples(commandMetadata.options)}`;
}
