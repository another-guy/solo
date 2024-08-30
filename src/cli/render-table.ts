import Table from 'cli-table3';

export interface ColumnDef<TItem> {
  title: string;
  width: number | 'max';
  selector: (item: TItem) => string;
}

export interface Options {
  style: Table.TableConstructorOptions['style'];
  chars: Table.TableConstructorOptions['chars'];
};

const noPaddingStyle: Table.TableConstructorOptions['style'] = { 'padding-left': 0, 'padding-right': 0 };

const noLinesChars: Table.TableConstructorOptions['chars'] = {
  'top': '', 'top-mid': '', 'top-left': '', 'top-right': '',
  'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': '',
  'left': '', 'left-mid': '', 'mid': '', 'mid-mid': '',
  'right': '', 'right-mid': '', 'middle': '',
};

const defaultOptions: Options = {
  style: noPaddingStyle,
  chars: noLinesChars,
};

/**
 * Strips out ANSI escape codes from text.
 * @see https://stackoverflow.com/a/29497680
 * @param text The text to sanitize.
 * @returns The sanitized text.
 */
const visbileText = (text: string) => text.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

export function renderTable<TItem>(
  columnDefinitions: ColumnDef<TItem>[],
  items: TItem[],
  options?: Options,
): string {
  const optionsToUse = { ...defaultOptions, ...options };

  const table = new Table({
    ...optionsToUse,
    head: columnDefinitions.map((definition) => definition.title),
    colWidths: columnDefinitions
      .map((definition) =>
        definition.width === 'max' ?
          (() => {
            const max = Math.max(...[definition.title.length, ...items.map(text => visbileText(definition.selector(text)).length)]) + 2;
            console.log(max);
            return max;
          })() :
          definition.width,
      ),
  });
  items.forEach((item) => {
    table.push(columnDefinitions.map((definition) => definition.selector(item)));
  });
  return table.toString();
}
