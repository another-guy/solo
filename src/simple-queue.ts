interface Element<T> {
  next: Element<T> | undefined;
  value: T;
}

export function createQueue<T>() {
  let head: Element<T> | undefined = undefined;
  let tail: Element<T> | undefined = head;

  function isEmpty(): boolean { return head === undefined; }

  function push(value: T): void {
    const newElement = { next: undefined, value };
    if (!tail) {
      head = newElement;
      tail = newElement;
    } else {
      tail.next = newElement;
      tail = newElement;
    }
  }

  function pop(): T {
    if (!head) throw new Error(`Can't dequeue from an empty queue.`);
    const { value } = head;
    head = head.next;
    if (!head) tail = undefined;
    return value;
  }

  function peek(): T {
    if (!head) throw new Error(`Can't peek into an empty queue.`);
    return head.value;
  }

  return { isEmpty, push, pop, peek };
};
