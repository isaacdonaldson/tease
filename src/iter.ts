import { TaggedError } from "./error";
import { Option } from "./option";
import { Result } from "./result";

/*
Considerations:
- Is this the API I want for this?
- What is the overhead of this vs. other options
- Is this performant, and how can I make it more performant?
- Is there a different way to do the implementations to not consume the iter
- Use the type system better
- Decide how I want error handling to work?
- Better intergration with the other parts of this library
*/

/**
 * Represents a lazy iterator over a sequence of values.
 * @template T The type of elements in the iterator.
 */
export class Iterator<T> implements Iterable<T> {
  private source: Iterable<T>;
  private transformations: ((value: T) => T)[] = [];
  private filters: ((value: T) => boolean)[] = [];

  /**
   * Creates a new Iterator instance.
   * @param source The source iterable to iterate over.
   */
  constructor(source: Iterable<T>) {
    this.source = source;
  }

  /**
   * Returns the iterator itself, making it compatible with for...of loops.
   * @returns An iterable iterator of the values.
   */
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

  /**
   * Applies a transformation function to each element in the iterator.
   * @template U The type of the transformed elements.
   * @param fn The transformation function to apply.
   * @returns A new Iterator with the transformed elements.
   */
  map<U>(fn: (value: T) => U): Iterator<U> {
    const mappedIterator = new Iterator<U>(this as any);
    mappedIterator.transformations = [...this.transformations, fn as any];
    return mappedIterator;
  }

  /**
   * Filters elements in the iterator based on a predicate function.
   * @param predicate The function to test each element.
   * @returns A new Iterator with elements that pass the predicate.
   */
  filter(predicate: (value: T) => boolean): Iterator<T> {
    const filteredIterator = new Iterator<T>(this);
    filteredIterator.filters = [...this.filters, predicate];
    return filteredIterator;
  }

  /**
   * Reduces the iterator to a single value using an accumulator function.
   * @template U The type of the accumulated result.
   * @param fn The accumulator function.
   * @param initialValue The initial value of the accumulator.
   * @returns The final accumulated value.
   */
  fold<U>(fn: (acc: U, value: T) => U, initialValue: U): U {
    let result = initialValue;
    for (const value of this) {
      result = fn(result, value);
    }
    return result;
  }

  /**
   * Collects all elements of the iterator into an array.
   * @returns A Result containing the array of elements or an error.
   */
  collect(): Result<T[], Error> {
    return Result.try(() => Array.from(this));
  }

  /**
   * Finds the first element in the iterator that satisfies a predicate.
   * @param predicate The function to test each element.
   * @returns An Option containing the found element or None.
   */
  find(predicate: (value: T) => boolean): Option<T> {
    for (const value of this) {
      if (predicate(value)) {
        return Option.some(value as NonNullable<T>);
      }
    }
    return Option.none();
  }

  /**
   * Finds the index of the first element that satisfies a predicate.
   * @param predicate The function to test each element.
   * @returns An Option containing the index of the found element or None.
   */
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

  /**
   * Creates a new Iterator with elements in reverse order.
   * @returns A new Iterator with reversed elements.
   */
  reverse(): Iterator<T> {
    return new Iterator<T>({
      [Symbol.iterator]: () => {
        const values = this.collect().unwrap();

        return (function* () {
          for (let i = values.length - 1; i >= 0; i--) {
            yield values[i];
          }
        })();
      },
    });
  }

  /**
   * Returns the last element in the iterator.
   * @returns An Option containing the last element or None if empty.
   */
  last(): Option<T> {
    let lastValue: T | undefined;
    for (const value of this) {
      lastValue = value;
    }
    return Option.fromNullable(lastValue);
  }

  /**
   * Creates a new Iterator that skips the first n elements.
   * @param n The number of elements to skip.
   * @returns A new Iterator starting after the skipped elements.
   * @throws {IterNegativeNumberError} If n is negative.
   */
  skip(n: number): Iterator<T> {
    if (n < 0) {
      throw new IterNegativeNumberError("Cannot skip a negative number of elements");
    }
    return new Iterator<T>({
      [Symbol.iterator]: () => {
        const sourceIterator = this[Symbol.iterator]();
        let count = 0;
        // TODO: Does this make sense to do the skip in the returned iterator?
        return (function* () {
          while (count < n) {
            const _v = sourceIterator.next();
            if (_v.done) {
              return;
            }
            count++;
          }

          yield* sourceIterator;
        })();
      },
    });
  }

  /**
   * Tests if any element in the iterator satisfies a predicate.
   * @param predicate The function to test each element.
   * @returns True if any element satisfies the predicate, false otherwise.
   */
  some(predicate: (value: T) => boolean): boolean {
    for (const value of this) {
      if (predicate(value)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Tests if all elements in the iterator satisfy a predicate.
   * @param predicate The function to test each element.
   * @returns True if all elements satisfy the predicate, false otherwise.
   */
  all(predicate: (value: T) => boolean): boolean {
    for (const value of this) {
      if (!predicate(value)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Creates a new Iterator with at most n elements from the start.
   * @param n The maximum number of elements to take.
   * @returns A new Iterator with at most n elements.
   * @throws {IterNegativeNumberError} If n is negative.
   */
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

  /**
   * Maps elements to a new type and filters out None results.
   * @template U The type of the mapped elements.
   * @param fn The mapping function that returns an Option.
   * @returns A new Iterator with mapped and filtered elements.
   */
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

  /**
   * Applies a side-effect function to each element without modifying the iterator.
   * @param fn The side-effect function to apply.
   * @returns A new Iterator with the same elements.
   */
  tap(fn: (value: T) => void): Iterator<T> {
    return new Iterator<T>({
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

  /**
   * Groups elements into chunks of a specified size.
   * @param n The size of each chunk.
   * @returns A new Iterator of arrays, each containing n elements.
   * @throws {IterNegativeNumberError} If n is less than or equal to 0.
   */
  chunk(n: number): Iterator<T[]> {
    if (n <= 0) {
      throw new IterNegativeNumberError("Chunk size must be greater than 0");
    }

    return new Iterator<T[]>({
      [Symbol.iterator]: () => {
        const sourceIterator = this[Symbol.iterator]();
        let count = 0;
        let chunk: T[] = [];
        return (function* () {
          for (let value of sourceIterator) {
            if (chunk.length === n) {
              yield chunk;
              chunk = [];
            }
            count++;
            chunk.push(value);
          }

          if (chunk.length !== 0) {
            yield chunk;
          }
        })();
      },
    });
  }

  /**
   * Counts the number of elements in the iterator.
   * @returns The total count of elements.
   */
  count(): number {
    return this.fold((acc) => acc + 1, 0);
  }

  /**
   * Combines two iterators into a single iterator of pairs.
   * @template U The type of elements in the other iterator.
   * @param other The other iterator to zip with.
   * @returns A new Iterator of pairs [T, U].
   */
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

  /**
   * Separates an iterator of pairs into two separate iterators.
   * @template T The type of the first element in each pair.
   * @template U The type of the second element in each pair.
   * @returns A tuple of two Iterators, one for first elements and one for second elements.
   */
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

  /**
   * Returns the nth element in the iterator.
   * @param n The index of the element to return (0-based).
   * @returns An Option containing the nth element or None if out of bounds.
   * @throws {IterNegativeNumberError} If n is negative.
   */
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

  /**
   * Groups elements by a key generated from each element.
   * @template U The type of the grouping key.
   * @param keyFn The function to generate the grouping key for each element.
   * @returns A Map where keys are the group keys and values are arrays of grouped elements.
   */
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

  /**
   * Sorts the elements of the iterator based on a key function.
   * @template U The type of the sorting key.
   * @param keyFn The function to generate the sorting key for each element.
   * @returns A new Iterator with sorted elements.
   */
  sortBy<U>(keyFn: (value: T) => U): Iterator<T> {
    const sourceArray = this.collect().unwrap();
    sourceArray.sort((a, b) => {
      const keyA = keyFn(a);
      const keyB = keyFn(b);
      if (keyA < keyB) return -1;
      if (keyA > keyB) return 1;
      return 0;
    });
    return new Iterator(sourceArray);
  }
}

/**
 * Error thrown when supplied a negative number
 */
export class IterNegativeNumberError extends TaggedError {
  readonly _tag = "IterNegativeNumberError" as const;
}

/**
 * Error thrown when collecting an iterator
 */
export class IterCollectError extends TaggedError {
  readonly _tag = "IterCollectError" as const;
}
