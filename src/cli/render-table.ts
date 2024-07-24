import Table from 'cli-table3';

export interface ColumnDef<TItem> {
  title: string;
  width: number;
  selector: (item: TItem) => string;
}

export interface Options {
  style: Table.TableConstructorOptions['style'];
  chars: Table.TableConstructorOptions['chars'];
};

const noPaddingStyle: Table.TableConstructorOptions['style'] = { 'padding-left': 0, 'padding-right': 0 };

const noLinesChars: Table.TableConstructorOptions['chars'] = {
  'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': '',
  'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': '',
  'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': '',
  'right': '' , 'right-mid': '' , 'middle': '',
};

const defaultOptions: Options = {
  style: noPaddingStyle,
  chars: noLinesChars,
};

export function renderTable<TItem>(
  columnDefinitions: ColumnDef<TItem>[],
  items: TItem[],
  options?: Options,
): string {
  const optionsToUse = { ...defaultOptions, ...options };

  const table = new Table({
    ...optionsToUse,
    head: columnDefinitions.map((definition) => definition.title),
    colWidths: columnDefinitions.map((definition) => definition.width),
  });
  items.forEach((item) => {
    table.push(columnDefinitions.map((definition) => definition.selector(item)));
  });
  return table.toString();
}
