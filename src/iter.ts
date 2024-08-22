import { TaggedError } from "./error";
import { Option } from "./option";

export class Iterator<T> implements Iterable<T> {
  private source: Iterable<T>;
  private transformations: ((value: T) => T)[] = [];
  private filters: ((value: T) => boolean)[] = [];

  constructor(source: Iterable<T>) {
    this.source = source;
  }

  [Symbol.iterator](): IterableIterator<T> {
    return this.values();
  }

  private *values(): IterableIterator<T> {
    for (const value of this.source) {
      let currentValue = value;

      if (this.filters.every((filter) => filter(currentValue))) {
        for (const transform of this.transformations) {
          currentValue = transform(currentValue);
        }
        yield currentValue;
      }
    }
  }

  map<U>(fn: (value: T) => U): Iterator<U> {
    const mappedIterator = new Iterator<U>(this as any);
    mappedIterator.transformations = [...this.transformations, fn as any];
    return mappedIterator;
  }

  filter(predicate: (value: T) => boolean): Iterator<T> {
    const filteredIterator = new Iterator<T>(this);
    filteredIterator.filters = [...this.filters, predicate];
    return filteredIterator;
  }

  fold<U>(fn: (acc: U, value: T) => U, initialValue: U): U {
    let result = initialValue;
    for (const value of this) {
      result = fn(result, value);
    }
    return result;
  }

  collect(): T[] {
    return Array.from(this);
  }

  find(predicate: (value: T) => boolean): Option<T> {
    for (const value of this) {
      if (predicate(value)) {
        return Option.some(value as NonNullable<T>);
      }
    }
    return Option.none();
  }

  position(predicate: (value: T) => boolean): Option<number> {
    let idx = 0;
    for (const value of this) {
      if (predicate(value)) {
        return Option.some(idx);
      }
      idx++;
    }
    return Option.none();
  }

  reverse(): Iterator<T> {
    return new Iterator<T>({
      [Symbol.iterator]: () => {
        const values = this.collect();

        return (function* () {
          for (let i = values.length - 1; i >= 0; i--) {
            yield values[i];
          }
        })();
      },
    });
  }

  last(): Option<T> {
    let lastValue: T | undefined;
    for (const value of this) {
      lastValue = value;
    }
    return Option.fromNullable(lastValue);
  }

  skip(n: number): Iterator<T> {
    if (n < 0) {
      throw new IterNegativeNumberError("Cannot skip a negative number of elements");
    }
    return new Iterator<T>({
      [Symbol.iterator]: () => {
        const sourceIterator = this[Symbol.iterator]();
        let count = 0;
        return (function* () {
          while (count < n) {
            for (const _ of sourceIterator) {
              count++;
            }
          }

          yield* sourceIterator;
        })();
      },
    });
  }

  some(predicate: (value: T) => boolean): boolean {
    for (const value of this) {
      if (predicate(value)) {
        return true;
      }
    }
    return false;
  }

  all(predicate: (value: T) => boolean): boolean {
    for (const value of this) {
      if (!predicate(value)) {
        return false;
      }
    }
    return true;
  }

  take(n: number): Iterator<T> {
    if (n < 0) {
      throw new IterNegativeNumberError("Cannot take a negative number of elements");
    }

    return new Iterator<T>({
      [Symbol.iterator]: () => {
        const iterator = this[Symbol.iterator]();
        let count = 0;
        return {
          next: () => {
            if (count < n) {
              count++;
              return iterator.next();
            }
            return { done: true, value: undefined };
          },
        };
      },
    });
  }

  filterMap<U>(fn: (value: T) => Option<U>): Iterator<U> {
    return new Iterator<U>({
      [Symbol.iterator]: () => {
        const sourceIterator = this[Symbol.iterator]();
        return (function* () {
          for (const values of sourceIterator) {
            const result = fn(values);
            if (result.isSome()) {
              yield result.unwrap();
            }
          }
        })();
      },
    });
  }

  tap(fn: (value: T) => void): Iterator<T> {
    return new Iterator<U>({
      [Symbol.iterator]: () => {
        const sourceIterator = this[Symbol.iterator]();
        return (function* () {
          for (const values of sourceIterator) {
            fn(values);
            yield values;
          }
        })();
      },
    });
  }

  chunk(n: number): Iterator<T[]> {
    if (n <= 0) {
      throw new IterNegativeNumberError("Chunk size must be greater than 0");
    }

    return new Iterator<T[]>({
      [Symbol.iterator]: () => {
        const sourceIterator = this[Symbol.iterator]();
        const chunk: T[] = [];
        for (let i = 0; i < n; i++) {
          for (const values of sourceIterator) {
            chunk.push(values);
          }
        }

        return (function* () {
          yield chunk;
        })();
      },
    });
  }

  count(): number {
    return this.fold((acc) => acc + 1, 0);
  }

  zip<U>(other: Iterable<U>): Iterator<[T, U]> {
    return new Iterator<[T, U]>({
      [Symbol.iterator]: () => {
        const sourceIterator = this[Symbol.iterator]();
        const otherIterator = other[Symbol.iterator]();

        return (function* () {
          for (const values of sourceIterator) {
            const otherValue = otherIterator.next();
            if (otherValue.done) break;
            yield [values, otherValue.value];
          }
        })();
      },
    });
  }

  unzip<T, U>(this: Iterator<[T, U]>): [Iterator<T>, Iterator<U>] {
    return [
      new Iterator<T>({
        [Symbol.iterator]: () => {
          const sourceIterator = this[Symbol.iterator]();
          return (function* () {
            for (const [first] of sourceIterator) {
              yield first;
            }
          })();
        },
      }),
      new Iterator<U>({
        [Symbol.iterator]: () => {
          const sourceIterator = this[Symbol.iterator]();
          return (function* () {
            for (const [, second] of sourceIterator) {
              yield second;
            }
          })();
        },
      }),
    ];
  }

  nth(n: number): Option<T> {
    if (n < 0) {
      throw new IterNegativeNumberError("Cannot take a negative number of elements");
    }

    for (const value of this) {
      if (n === 0) {
        return Option.some(value as NonNullable<T>);
      }
      n--;
    }
    return Option.none();
  }

  groupBy<U>(keyFn: (value: T) => U): Map<U, T[]> {
    const groups = new Map<U, T[]>();
    const sourceIterator = this[Symbol.iterator]();

    for (const values of sourceIterator) {
      const key = keyFn(values);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(values);
    }

    return groups;
  }

  sortBy<U>(keyFn: (value: T) => U): Iterator<T> {
    const sourceArray = this.collect();
    sourceArray.sort((a, b) => {
      const keyA = keyFn(a);
      const keyB = keyFn(b);
      if (keyA < keyB) return -1;
      if (keyA > keyB) return 1;
      return 0;
    });
    return new Iterator(sourceArray);
  }

  // static fromAsync<T>(asyncIterable: AsyncIterable<T>): AsyncIterator<T> {
  //   return new AsyncIterator(asyncIterable);
  // }
}

export class AsyncIterator<T> implements AsyncIterable<T> {
  private source: AsyncIterable<T>;
  private transformations: ((value: T) => Promise<T> | T)[] = [];
  private filters: ((value: T) => Promise<boolean> | boolean)[] = [];

  constructor(source: AsyncIterable<T>) {
    this.source = source;
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    return this.values();
  }

  private async *values(): AsyncIterableIterator<T> {
    for await (const value of this.source) {
      let currentValue = value;

      if (await this.applyFilters(currentValue)) {
        currentValue = await this.applyTransformations(currentValue);
        yield currentValue;
      }
    }
  }

  private async applyFilters(value: T): Promise<boolean> {
    for (const filter of this.filters) {
      if (!(await filter(value))) {
        return false;
      }
    }
    return true;
  }

  private async applyTransformations(value: T): Promise<T> {
    let result = value;
    for (const transform of this.transformations) {
      result = await transform(result);
    }
    return result;
  }

  map<U>(fn: (value: T) => Promise<U> | U): AsyncIterator<U> {
    const mappedIterator = new AsyncIterator<U>(this as any);
    mappedIterator.transformations = [...this.transformations, fn as any];
    return mappedIterator;
  }

  filter(
    predicate: (value: T) => Promise<boolean> | boolean,
  ): AsyncIterator<T> {
    const filteredIterator = new AsyncIterator<T>(this);
    filteredIterator.filters = [...this.filters, predicate];
    return filteredIterator;
  }

  async collect(): Promise<T[]> {
    const result: T[] = [];
    for await (const value of this) {
      result.push(value);
    }
    return result;
  }
}

/**
 * Error thrown when supplied a negative number
 */
export class IterNegativeNumberError extends TaggedError {
  readonly _tag = "IterNegativeNumberError" as const;
}
