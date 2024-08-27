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


export const Iterator = {
  from<T>(source: Iterable<T>): LazyIterator<T> {
    return new LazyIterator(source);
  }
}

/**
 * Represents a lazy LazyIterator over a sequence of values.
 * @template T The type of elements in the LazyIterator.
 */
export class LazyIterator<T> implements Iterable<T> {
  private source: Iterable<T>;
  private transformations: ((value: T) => T)[] = [];
  private filters: ((value: T) => boolean)[] = [];

  /**
   * Creates a new LazyIterator instance.
   * @param source The source iterable to iterate over.
   */
  constructor(source: Iterable<T>) {
    this.source = source;
  }

  /**
   * Returns the LazyIterator itself, making it compatible with for...of loops.
   * @returns An iterable LazyIterator of the values.
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
   * Applies a transformation function to each element in the LazyIterator.
   * @template U The type of the transformed elements.
   * @param fn The transformation function to apply.
   * @returns A new LazyIterator with the transformed elements.
   */
  map<U>(fn: (value: T) => U): LazyIterator<U> {
    const mappedLazyIterator = new LazyIterator<U>(this as any);
    mappedLazyIterator.transformations = [...this.transformations, fn as any];
    return mappedLazyIterator;
  }

  /**
   * Filters elements in the LazyIterator based on a predicate function.
   * @param predicate The function to test each element.
   * @returns A new LazyIterator with elements that pass the predicate.
   */
  filter(predicate: (value: T) => boolean): LazyIterator<T> {
    const filteredLazyIterator = new LazyIterator<T>(this);
    filteredLazyIterator.filters = [...this.filters, predicate];
    return filteredLazyIterator;
  }

  /**
   * Reduces the LazyIterator to a single value using an accumulator function.
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
   * Collects all elements of the LazyIterator into an array.
   * @returns A Result containing the array of elements or an error.
   */
  collect(): Result<T[], Error> {
    return Result.try(() => Array.from(this));
  }

  /**
   * Finds the first element in the LazyIterator that satisfies a predicate.
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
   * Creates a new LazyIterator with elements in reverse order.
   * @returns A new LazyIterator with reversed elements.
   */
  reverse(): LazyIterator<T> {
    return new LazyIterator<T>({
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
   * Returns the last element in the LazyIterator.
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
   * Creates a new LazyIterator that skips the first n elements.
   * @param n The number of elements to skip.
   * @returns A new LazyIterator starting after the skipped elements.
   * @throws {IterNegativeNumberError} If n is negative.
   */
  skip(n: number): LazyIterator<T> {
    if (n < 0) {
      throw new IterNegativeNumberError("Cannot skip a negative number of elements");
    }
    return new LazyIterator<T>({
      [Symbol.iterator]: () => {
        const sourceLazyIterator = this[Symbol.iterator]();
        let count = 0;
        // TODO: Does this make sense to do the skip in the returned LazyIterator?
        return (function* () {
          while (count < n) {
            const _v = sourceLazyIterator.next();
            if (_v.done) {
              return;
            }
            count++;
          }

          yield* sourceLazyIterator;
        })();
      },
    });
  }

  /**
   * Tests if any element in the LazyIterator satisfies a predicate.
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
   * Tests if all elements in the LazyIterator satisfy a predicate.
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
   * Creates a new LazyIterator with at most n elements from the start.
   * @param n The maximum number of elements to take.
   * @returns A new LazyIterator with at most n elements.
   * @throws {IterNegativeNumberError} If n is negative.
   */
  take(n: number): LazyIterator<T> {
    if (n < 0) {
      throw new IterNegativeNumberError("Cannot take a negative number of elements");
    }

    return new LazyIterator<T>({
      [Symbol.iterator]: () => {
        const LazyIterator = this[Symbol.iterator]();
        let count = 0;
        return {
          next: () => {
            if (count < n) {
              count++;
              return LazyIterator.next();
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
   * @returns A new LazyIterator with mapped and filtered elements.
   */
  filterMap<U>(fn: (value: T) => Option<U>): LazyIterator<U> {
    return new LazyIterator<U>({
      [Symbol.iterator]: () => {
        const sourceLazyIterator = this[Symbol.iterator]();
        return (function* () {
          for (const values of sourceLazyIterator) {
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
   * Applies a side-effect function to each element without modifying the LazyIterator.
   * @param fn The side-effect function to apply.
   * @returns A new LazyIterator with the same elements.
   */
  tap(fn: (value: T) => void): LazyIterator<T> {
    return new LazyIterator<T>({
      [Symbol.iterator]: () => {
        const sourceLazyIterator = this[Symbol.iterator]();
        return (function* () {
          for (const values of sourceLazyIterator) {
            fn(values);
            yield values;
          }
        })();
      },
    });
  }

  /**
   * Prints out each element of the LazyIterator and then returns it.
   * @returns A new LazyIterator with the same elements.
   */
  debug(): LazyIterator<T> {
    return new LazyIterator<T>({
      [Symbol.iterator]: () => {
        const sourceLazyIterator = this[Symbol.iterator]();
        return (function* () {
          for (const values of sourceLazyIterator) {
            console.log(values);
            yield values;
          }
        })();
      },
    });
  }

  /**
   * Groups elements into chunks of a specified size.
   * @param n The size of each chunk.
   * @returns A new LazyIterator of arrays, each containing n elements.
   * @throws {IterNegativeNumberError} If n is less than or equal to 0.
   */
  chunk(n: number): LazyIterator<T[]> {
    if (n <= 0) {
      throw new IterNegativeNumberError("Chunk size must be greater than 0");
    }

    return new LazyIterator<T[]>({
      [Symbol.iterator]: () => {
        const sourceLazyIterator = this[Symbol.iterator]();
        let count = 0;
        let chunk: T[] = [];
        return (function* () {
          for (let value of sourceLazyIterator) {
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
   * Counts the number of elements in the LazyIterator.
   * @returns The total count of elements.
   */
  count(): number {
    return this.fold((acc) => acc + 1, 0);
  }

  /**
   * Combines two LazyIterators into a single LazyIterator of pairs.
   * @template U The type of elements in the other LazyIterator.
   * @param other The other LazyIterator to zip with.
   * @returns A new LazyIterator of pairs [T, U].
   */
  zip<U>(other: Iterable<U>): LazyIterator<[T, U]> {
    return new LazyIterator<[T, U]>({
      [Symbol.iterator]: () => {
        const sourceLazyIterator = this[Symbol.iterator]();
        const otherLazyIterator = other[Symbol.iterator]();

        return (function* () {
          for (const values of sourceLazyIterator) {
            const otherValue = otherLazyIterator.next();
            if (otherValue.done) break;
            yield [values, otherValue.value];
          }
        })();
      },
    });
  }

  /**
   * Separates an LazyIterator of pairs into two separate LazyIterators.
   * @template T The type of the first element in each pair.
   * @template U The type of the second element in each pair.
   * @returns A tuple of two LazyIterators, one for first elements and one for second elements.
   */
  unzip<T, U>(this: LazyIterator<[T, U]>): [LazyIterator<T>, LazyIterator<U>] {
    return [
      new LazyIterator<T>({
        [Symbol.iterator]: () => {
          const sourceLazyIterator = this[Symbol.iterator]();
          return (function* () {
            for (const [first] of sourceLazyIterator) {
              yield first;
            }
          })();
        },
      }),
      new LazyIterator<U>({
        [Symbol.iterator]: () => {
          const sourceLazyIterator = this[Symbol.iterator]();
          return (function* () {
            for (const [, second] of sourceLazyIterator) {
              yield second;
            }
          })();
        },
      }),
    ];
  }

  /**
   * Returns the nth element in the LazyIterator.
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
    const sourceLazyIterator = this[Symbol.iterator]();

    for (const values of sourceLazyIterator) {
      const key = keyFn(values);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(values);
    }

    return groups;
  }

  /**
   * Sorts the elements of the LazyIterator based on a key function.
   * @template U The type of the sorting key.
   * @param keyFn The function to generate the sorting key for each element.
   * @returns A new LazyIterator with sorted elements.
   */
  sortBy<U>(keyFn: (value: T) => U): LazyIterator<T> {
    const sourceArray = this.collect().unwrap();
    sourceArray.sort((a, b) => {
      const keyA = keyFn(a);
      const keyB = keyFn(b);
      if (keyA < keyB) return -1;
      if (keyA > keyB) return 1;
      return 0;
    });
    return new LazyIterator(sourceArray);
  }
}

/**
 * Error thrown when supplied a negative number
 */
export class IterNegativeNumberError extends TaggedError {
  readonly _tag = "IterNegativeNumberError" as const;
}

/**
 * Error thrown when collecting an LazyIterator
 */
export class IterCollectError extends TaggedError {
  readonly _tag = "IterCollectError" as const;
}
