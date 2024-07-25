export function sort<T>(
  items: T[],
  ...comparators: Comparator<T>[]
): T[] {
  const compare = combineComparators(...comparators);
  return sortImpl(items, compare);

  function sortImpl<T>(
    items: T[],
    compare: (a: T, b: T) => number,
  ): T[] {
    if (items.length <= 1) return items;

    const pivot = items[0];
    const left: T[] = [];
    const right: T[] = [];
    for (let i = 1; i < items.length; i++) {
      if (compare(items[i], pivot) < 0) {
        left.push(items[i]);
      } else {
        right.push(items[i]);
      }
    }
    return sortImpl(left, compare).concat(pivot, sortImpl(right, compare));
  }
}

export type Comparator<T> = (a: T, b: T) => number;

export function combineComparators<T>(...comparators: Comparator<T>[]): Comparator<T> {
  return (a: T, b: T) => {
    for (const comparator of comparators) {
      const result = comparator(a, b);
      if (result !== 0) return result;
    }
    return 0;
  };
}

export function compareStrings(a: string, b: string): number {
  return a.localeCompare(b);
}
export function compareNumbers(a: number, b: number): number {
  return a - b;
}
export function compareBooleans(a: boolean, b: boolean): number {
  return a === b ? 0 : a ? 1 : -1;
}
export function compareDates(a: Date, b: Date): number {
  return a.getTime() - b.getTime();
}

export function createComparator(lowToHighValues: string[]): Comparator<string> {
  return (a, b) => lowToHighValues.indexOf(a) - lowToHighValues.indexOf(b);
}

export function reverseComparator<T>(comparator: Comparator<T>): Comparator<T> {
  return (a, b) => -comparator(a, b);
}
