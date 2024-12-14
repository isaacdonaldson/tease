import { TaggedError } from "./error.js";
import { Option } from "./option.js";
import { Result } from "./result.js";
/**
 * Factory object for creating LazyIterator instances
 */
export declare const Iterator: {
    /**
     * Creates a new LazyIterator from an iterable source
     * @template T The type of elements in the iterator
     * @param {Iterable<T>} source The source iterable
     * @returns {LazyIterator<T>} A new LazyIterator instance
     */
    from<T>(source: Iterable<T>): LazyIterator<T>;
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
declare class LazyIterator<T> implements Iterable<T> {
    private source;
    private operations;
    private reversed;
    /**
     * Creates a new LazyIterator
     * @param {Iterable<T>} source The source iterable
     */
    constructor(source: Iterable<T>);
    /**
     * Implements the Iterator protocol
     * @returns {Iterator<T>} An iterator over the elements
     */
    [Symbol.iterator](): Iterator<T>;
    /**
     * Transforms each element using the provided function
     * @template U The type of the transformed elements
     * @param {MapFn<T, U>} fn The transformation function
     * @returns {LazyIterator<U>} A new iterator with transformed elements
     */
    map<U>(fn: MapFn<T, U>): LazyIterator<U>;
    /**
     * Filters elements based on a predicate
     * @param {FilterFn<T>} fn The predicate function
     * @returns {LazyIterator<T>} A new iterator with filtered elements
     */
    filter(fn: FilterFn<T>): LazyIterator<T>;
    /**
     * Combines filtering and mapping in a single operation
     * @template U The type of the transformed elements
     * @param {FilterMapFn<T, U>} fn The filter-map function
     * @returns {LazyIterator<U>} A new iterator with transformed elements
     */
    filterMap<U>(fn: FilterMapFn<T, U>): LazyIterator<U>;
    /**
     * Takes the first n elements from the iterator
     * @param {number} n The number of elements to take
     * @returns {LazyIterator<T>} A new iterator with at most n elements
     */
    take(n: number): LazyIterator<T>;
    /**
     * Skips the first n elements of the iterator
     * @param {number} n The number of elements to skip
     * @returns {LazyIterator<T>} A new iterator starting after the skipped elements
     */
    skip(n: number): LazyIterator<T>;
    /**
     * Returns the nth element of the iterator
     * @param {number} n The index of the element to return
     * @returns {Option<T>} The nth element, if it exists
     */
    nth(n: number): Option<T>;
    /**
     * Returns the last element of the iterator
     * @returns {Option<T>} The last element, if it exists
     */
    last(): Option<T>;
    /**
     * Reverses the order of elements in the iterator
     * @returns {LazyIterator<T>} A new iterator with reversed elements
     */
    reverse(): LazyIterator<T>;
    /**
     * Performs a side effect for each element without modifying the iterator
     * @param {TapFn<T>} fn The function to execute for each element
     * @returns {LazyIterator<T>} The same iterator for chaining
     */
    tap(fn: TapFn<T>): LazyIterator<T>;
    /**
     * Prints each element for debugging purposes
     * @param {string} prefix Optional prefix to add before each element
     * @returns {LazyIterator<T>} The same iterator for chaining
     */
    debug(prefix?: string): LazyIterator<T>;
    /**
     * Groups elements into chunks of the specified size
     * @param {number} size The size of each chunk
     * @returns {Result<LazyIterator<T[]>, IterNegativeNumberError>} A Result containing either a new iterator of chunks or an error
     */
    chunk(size: number): Result<LazyIterator<T[]>, IterNegativeNumberError>;
    /**
     * Counts the number of elements in the iterator
     * @returns {number} The number of elements
     */
    count(): number;
    /**
     * Combines this iterator with another iterable by pairing their elements
     * @template U The type of elements in the other iterable
     * @param {Iterable<U>} other The other iterable to zip with
     * @returns {LazyIterator<[T, U]>} A new iterator of paired elements
     */
    zip<U>(other: Iterable<U>): LazyIterator<[T, U]>;
    /**
     * Splits an iterator of pairs into a pair of arrays
     * @template T The type of the first element in each pair
     * @template U The type of the second element in each pair
     * @returns {Result<[T[], U[]], IterUnzipError>} A Result containing either the unzipped arrays or an error
     */
    unzip<T, U>(this: LazyIterator<[T, U]>): Result<[T[], U[]], IterUnzipError>;
    /**
     * Groups elements by a key function
     * @template K The type of the keys
     * @param {(value: T) => K} keyFn Function to generate keys
     * @returns {Result<Map<K, T[]>, IterGroupByError>} A Result containing either a Map of grouped elements or an error
     */
    groupBy<K>(keyFn: (value: T) => K): Result<Map<K, T[]>, IterGroupByError>;
    /**
     * Sorts elements using a comparison function
     * @param {CompareFn<T>} compareFn The comparison function
     * @returns {Result<LazyIterator<T>, IterSortByError>} A Result containing either a new sorted iterator or an error
     */
    sortBy(compareFn: CompareFn<T>): Result<LazyIterator<T>, IterSortByError>;
    /**
     * Finds the first element matching a predicate
     * @param {FilterFn<T>} predicate The predicate function
     * @returns {Option<T>} The first matching element, if any
     */
    find(predicate: FilterFn<T>): Option<T>;
    /**
     * Finds the position of the first element matching a predicate
     * @param {FilterFn<T>} predicate The predicate function
     * @returns {Option<number>} The position of the first matching element, if any
     */
    position(predicate: FilterFn<T>): Option<number>;
    /**
     * Tests if any element satisfies the predicate
     * @param {FilterFn<T>} predicate The predicate function
     * @returns {boolean} True if any element satisfies the predicate
     */
    some(predicate: FilterFn<T>): boolean;
    /**
     * Tests if all elements satisfy the predicate
     * @param {FilterFn<T>} predicate The predicate function
     * @returns {boolean} True if all elements satisfy the predicate
     */
    all(predicate: FilterFn<T>): boolean;
    /**
     * Reduces the iterator to a single value using the first element as initial value
     * @param {(acc: T, value: T) => T} fn The reduction function
     * @returns {Option<T>} The reduced value, if any
     */
    reduce(fn: (acc: T, value: T) => T): Option<T>;
    /**
     * Folds the iterator into a single value using a provided initial value
     * @template U The type of the accumulated value
     * @param {FoldFn<T, U>} fn The folding function
     * @param {U} initial The initial value
     * @returns {Result<U, IterFoldError>} A Result containing either the folded value or an error
     */
    fold<U>(fn: FoldFn<T, U>, initial: U): Result<U, IterFoldError>;
    /**
     * Collects all elements into an array
     * @returns {Result<T[], IterCollectError>} A Result containing either an array of elements or an error
     */
    collect(): Result<T[], IterCollectError>;
    /**
     * Internal generator function that evaluates the iterator chain
     * @private
     * @returns {Generator<T>} A generator of the transformed elements
     */
    private evaluate;
}
/**
 * Error thrown when supplied a negative number
 */
export declare class IterNegativeNumberError extends TaggedError {
    readonly _tag: "IterNegativeNumberError";
}
/**
 * Error thrown when collecting a LazyIterator
 */
export declare class IterCollectError extends TaggedError {
    readonly _tag: "IterCollectError";
}
/**
 * Error thrown when unzipping anLazyIterator
 */
export declare class IterUnzipError extends TaggedError {
    readonly _tag: "IterUnzipError";
}
/**
 * Error thrown when groupBy fails for a LazyIterator
 */
export declare class IterGroupByError extends TaggedError {
    readonly _tag: "IterGroupByError";
}
/**
 * Error thrown when sortBy fails for a LazyIterator
 */
export declare class IterSortByError extends TaggedError {
    readonly _tag: "IterSortByError";
}
/**
 * Error thrown when fold fails for a LazyIterator
 */
export declare class IterFoldError extends TaggedError {
    readonly _tag: "IterFoldError";
}
export {};
//# sourceMappingURL=iter.d.ts.map