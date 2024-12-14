import { TaggedError } from "./error.js";
import { Option } from "./option.js";
import { Result } from "./result.js";

/**
 * Factory object for creating LazyIterator instances
 */
export const Iterator = {
  /**
   * Creates a new LazyIterator from an iterable source
   * @template T The type of elements in the iterator
   * @param {Iterable<T>} source The source iterable
   * @returns {LazyIterator<T>} A new LazyIterator instance
   */
  from<T>(source: Iterable<T>): LazyIterator<T> {
    return new LazyIterator(source);
  },
};

/** Function that transforms a value of type T to type U */
type MapFn<T, U> = (value: T) => U;
/** Predicate function that tests a value of type T */
type FilterFn<T> = (value: T) => boolean;
/** Function that combines an accumulator with a value */
type FoldFn<T, U> = (acc: U, value: T) => U;
/** Function that performs a side effect on a value */
type TapFn<T> = (value: T) => void;
/** Function that optionally transforms a value */
type FilterMapFn<T, U> = (value: T) => Option<U>;
/** Comparison function for sorting */
type CompareFn<T> = (a: T, b: T) => number;

/**
 * A lazy iterator implementation that allows chaining operations
 * Operations are only performed when the iterator is consumed
 * @template T The type of elements in the iterator
 */
class LazyIterator<T> implements Iterable<T> {
  private source: Iterable<T>;
  private operations: Array<(value: any) => any> = [];
  private reversed = false;

  /**
   * Creates a new LazyIterator
   * @param {Iterable<T>} source The source iterable
   */
  constructor(source: Iterable<T>) {
    this.source = source;
  }

  /**
   * Implements the Iterator protocol
   * @returns {Iterator<T>} An iterator over the elements
   */
  [Symbol.iterator](): Iterator<T> {
    return this.evaluate();
  }

  /**
   * Transforms each element using the provided function
   * @template U The type of the transformed elements
   * @param {MapFn<T, U>} fn The transformation function
   * @returns {LazyIterator<U>} A new iterator with transformed elements
   */
  map<U>(fn: MapFn<T, U>): LazyIterator<U> {
    this.operations.push((value: T) => Option.some(fn(value) as NonNullable<U>));
    return this as unknown as LazyIterator<U>;
  }

  /**
   * Filters elements based on a predicate
   * @param {FilterFn<T>} fn The predicate function
   * @returns {LazyIterator<T>} A new iterator with filtered elements
   */
  filter(fn: FilterFn<T>): LazyIterator<T> {
    this.operations.push((value: T) => (fn(value) ? Option.some(value as NonNullable<T>) : Option.none()));
    return this;
  }

  /**
   * Combines filtering and mapping in a single operation
   * @template U The type of the transformed elements
   * @param {FilterMapFn<T, U>} fn The filter-map function
   * @returns {LazyIterator<U>} A new iterator with transformed elements
   */
  filterMap<U>(fn: FilterMapFn<T, U>): LazyIterator<U> {
    this.operations.push(fn);
    return this as unknown as LazyIterator<U>;
  }

  /**
   * Takes the first n elements from the iterator
   * @param {number} n The number of elements to take
   * @returns {LazyIterator<T>} A new iterator with at most n elements
   */
  take(n: number): LazyIterator<T> {
    if (n <= 0) {
      return new LazyIterator([]);
    }
    return new LazyIterator(
      function* (this: LazyIterator<T>) {
        let count = 0;
        for (const value of this.source) {
          if (count === n) {
            break;
          }

          let current = Option.some(value as NonNullable<T>) as Option<T>;

          for (const op of this.operations) {
            current = current.andThen(op) as Option<T>;
            if (current.isNone()) {
              break;
            }
          }

          if (current.isSome()) {
            yield current.unwrap();
            count++;
          }
        }
      }.call(this),
    );
  }

  /**
   * Skips the first n elements of the iterator
   * @param {number} n The number of elements to skip
   * @returns {LazyIterator<T>} A new iterator starting after the skipped elements
   */
  skip(n: number): LazyIterator<T> {
    let count = 0;
    this.operations.push((value: T) => (count++ < n ? Option.none() : Option.some(value as NonNullable<T>)));
    return this;
  }

  /**
   * Returns the nth element of the iterator
   * @param {number} n The index of the element to return
   * @returns {Option<T>} The nth element, if it exists
   */
  nth(n: number): Option<T> {
    const entry = this.skip(n).take(1).collect().ok() as Option<Array<T>>;
    const valueArr = entry.unwrapOr([]);
    return valueArr.length > 0 ? Option.some(valueArr[0] as NonNullable<T>) : Option.none();
  }

  /**
   * Returns the last element of the iterator
   * @returns {Option<T>} The last element, if it exists
   */
  last(): Option<T> {
    return this.reduce((_, curr) => curr);
  }

  /**
   * Reverses the order of elements in the iterator
   * @returns {LazyIterator<T>} A new iterator with reversed elements
   */
  reverse(): LazyIterator<T> {
    this.reversed = !this.reversed;
    return this;
  }

  /**
   * Performs a side effect for each element without modifying the iterator
   * @param {TapFn<T>} fn The function to execute for each element
   * @returns {LazyIterator<T>} The same iterator for chaining
   */
  tap(fn: TapFn<T>): LazyIterator<T> {
    this.operations.push((value: T) => {
      fn(value);
      return Option.some(value as NonNullable<T>);
    });
    return this;
  }

  /**
   * Prints each element for debugging purposes
   * @param {string} prefix Optional prefix to add before each element
   * @returns {LazyIterator<T>} The same iterator for chaining
   */
  debug(prefix = ""): LazyIterator<T> {
    return this.tap((value) => console.log(`${prefix}${value}`));
  }

  /**
   * Groups elements into chunks of the specified size
   * @param {number} size The size of each chunk
   * @returns {Result<LazyIterator<T[]>, IterNegativeNumberError>} A Result containing either a new iterator of chunks or an error
   */
  chunk(size: number): Result<LazyIterator<T[]>, IterNegativeNumberError> {
    if (size <= 0) {
      return Result.err(new IterNegativeNumberError("Chunk size must be positive"));
    }

    return Result.ok(
      new LazyIterator(
        function* (this: LazyIterator<T>) {
          let chunk: T[] = [];
          for (const value of this) {
            chunk.push(value);
            if (chunk.length === size) {
              yield chunk;
              chunk = [];
            }
          }
          if (chunk.length > 0) {
            yield chunk;
          }
        }.call(this),
      ),
    );
  }

  /**
   * Counts the number of elements in the iterator
   * @returns {number} The number of elements
   */
  count(): number {
    let count = 0;
    for (const _ of this) {
      count++;
    }
    return count;
  }

  /**
   * Combines this iterator with another iterable by pairing their elements
   * @template U The type of elements in the other iterable
   * @param {Iterable<U>} other The other iterable to zip with
   * @returns {LazyIterator<[T, U]>} A new iterator of paired elements
   */
  zip<U>(other: Iterable<U>): LazyIterator<[T, U]> {
    const self = this;
    return new LazyIterator(
      (function* () {
        const selfIterator = self[Symbol.iterator]();
        const otherIterator = other[Symbol.iterator]();

        while (true) {
          const selfNext = selfIterator.next();
          const otherNext = otherIterator.next();

          if (selfNext.done || otherNext.done) {
            break;
          }

          yield [selfNext.value, otherNext.value];
        }
      })(),
    );
  }

  /**
   * Splits an iterator of pairs into a pair of arrays
   * @template T The type of the first element in each pair
   * @template U The type of the second element in each pair
   * @returns {Result<[T[], U[]], IterUnzipError>} A Result containing either the unzipped arrays or an error
   */
  unzip<T, U>(this: LazyIterator<[T, U]>): Result<[T[], U[]], IterUnzipError> {
    try {
      const first: T[] = [];
      const second: U[] = [];
      for (const [a, b] of this) {
        first.push(a);
        second.push(b);
      }
      return Result.ok([first, second]);
    } catch (e) {
      return Result.err(new IterUnzipError(e instanceof Error ? e.message : "Failed to unzip"));
    }
  }

  /**
   * Groups elements by a key function
   * @template K The type of the keys
   * @param {(value: T) => K} keyFn Function to generate keys
   * @returns {Result<Map<K, T[]>, IterGroupByError>} A Result containing either a Map of grouped elements or an error
   */
  groupBy<K>(keyFn: (value: T) => K): Result<Map<K, T[]>, IterGroupByError> {
    try {
      const groups = new Map<K, T[]>();
      for (const value of this) {
        const key = keyFn(value);
        const group = groups.get(key) ?? [];
        group.push(value);
        groups.set(key, group);
      }
      return Result.ok(groups);
    } catch (e) {
      return Result.err(new IterGroupByError(e instanceof Error ? e.message : "Failed to groupBy"));
    }
  }

  /**
   * Sorts elements using a comparison function
   * @param {CompareFn<T>} compareFn The comparison function
   * @returns {Result<LazyIterator<T>, IterSortByError>} A Result containing either a new sorted iterator or an error
   */
  sortBy(compareFn: CompareFn<T>): Result<LazyIterator<T>, IterSortByError> {
    try {
      const sorted = [...this].sort(compareFn);
      return Result.ok(new LazyIterator(sorted));
    } catch (e) {
      return Result.err(new IterSortByError(e instanceof Error ? e.message : "Failed to sortBy"));
    }
  }

  /**
   * Finds the first element matching a predicate
   * @param {FilterFn<T>} predicate The predicate function
   * @returns {Option<T>} The first matching element, if any
   */
  find(predicate: FilterFn<T>): Option<T> {
    for (const value of this) {
      if (predicate(value)) {
        return Option.some(value as NonNullable<T>);
      }
    }
    return Option.none();
  }

  /**
   * Finds the position of the first element matching a predicate
   * @param {FilterFn<T>} predicate The predicate function
   * @returns {Option<number>} The position of the first matching element, if any
   */
  position(predicate: FilterFn<T>): Option<number> {
    let index = 0;
    for (const value of this) {
      if (predicate(value)) {
        return Option.some(index);
      }
      index++;
    }
    return Option.none();
  }

  /**
   * Tests if any element satisfies the predicate
   * @param {FilterFn<T>} predicate The predicate function
   * @returns {boolean} True if any element satisfies the predicate
   */
  some(predicate: FilterFn<T>): boolean {
    return this.find(predicate).isSome();
  }

  /**
   * Tests if all elements satisfy the predicate
   * @param {FilterFn<T>} predicate The predicate function
   * @returns {boolean} True if all elements satisfy the predicate
   */
  all(predicate: FilterFn<T>): boolean {
    for (const value of this) {
      if (!predicate(value)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Reduces the iterator to a single value using the first element as initial value
   * @param {(acc: T, value: T) => T} fn The reduction function
   * @returns {Option<T>} The reduced value, if any
   */
  reduce(fn: (acc: T, value: T) => T): Option<T> {
    const iterator = this[Symbol.iterator]();
    const first = iterator.next();

    if (first.done) {
      return Option.none();
    }

    let result = first.value;

    while (true) {
      const next = iterator.next();
      if (next.done) {
        break;
      }
      result = fn(result, next.value);
    }

    return Option.some(result as NonNullable<T>);
  }

  /**
   * Folds the iterator into a single value using a provided initial value
   * @template U The type of the accumulated value
   * @param {FoldFn<T, U>} fn The folding function
   * @param {U} initial The initial value
   * @returns {Result<U, IterFoldError>} A Result containing either the folded value or an error
   */
  fold<U>(fn: FoldFn<T, U>, initial: U): Result<U, IterFoldError> {
    try {
      let result = initial;
      for (const value of this) {
        result = fn(result, value);
      }
      return Result.ok(result);
    } catch (e) {
      return Result.err(new IterFoldError(e instanceof Error ? e.message : "Failed to fold"));
    }
  }

  /**
   * Collects all elements into an array
   * @returns {Result<T[], IterCollectError>} A Result containing either an array of elements or an error
   */
  collect(): Result<T[], IterCollectError> {
    try {
      const result = Array.from(this.evaluate());
      return Result.ok(this.reversed ? result.reverse() : result);
    } catch (e) {
      return Result.err(new IterCollectError(e instanceof Error ? e.message : "Failed to collect"));
    }
  }

  /**
   * Internal generator function that evaluates the iterator chain
   * @private
   * @returns {Generator<T>} A generator of the transformed elements
   */
  private *evaluate(): Generator<T> {
    for (const value of this.source) {
      let current = Option.some(value as NonNullable<T>) as Option<T>;

      for (const op of this.operations) {
        current = current.andThen(op) as Option<T>;
        if (current.isNone()) {
          break;
        }
      }

      if (current.isSome()) {
        yield current.unwrap();
      }
    }
  }
}

/**
 * Error thrown when supplied a negative number
 */
export class IterNegativeNumberError extends TaggedError {
  readonly _tag = "IterNegativeNumberError" as const;
}

/**
 * Error thrown when collecting a LazyIterator
 */
export class IterCollectError extends TaggedError {
  readonly _tag = "IterCollectError" as const;
}

/**
 * Error thrown when unzipping anLazyIterator
 */
export class IterUnzipError extends TaggedError {
  readonly _tag = "IterUnzipError" as const;
}

/**
 * Error thrown when groupBy fails for a LazyIterator
 */
export class IterGroupByError extends TaggedError {
  readonly _tag = "IterGroupByError" as const;
}

/**
 * Error thrown when sortBy fails for a LazyIterator
 */
export class IterSortByError extends TaggedError {
  readonly _tag = "IterSortByError" as const;
}

/**
 * Error thrown when fold fails for a LazyIterator
 */
export class IterFoldError extends TaggedError {
  readonly _tag = "IterFoldError" as const;
}
