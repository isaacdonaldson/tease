"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IterFoldError = exports.IterSortByError = exports.IterGroupByError = exports.IterUnzipError = exports.IterCollectError = exports.IterNegativeNumberError = exports.Iterator = void 0;
const error_js_1 = require("./error.js");
const option_js_1 = require("./option.js");
const result_js_1 = require("./result.js");
/**
 * Factory object for creating LazyIterator instances
 */
exports.Iterator = {
    /**
     * Creates a new LazyIterator from an iterable source
     * @template T The type of elements in the iterator
     * @param {Iterable<T>} source The source iterable
     * @returns {LazyIterator<T>} A new LazyIterator instance
     */
    from(source) {
        return new LazyIterator(source);
    },
};
/**
 * A lazy iterator implementation that allows chaining operations
 * Operations are only performed when the iterator is consumed
 * @template T The type of elements in the iterator
 */
class LazyIterator {
    /**
     * Creates a new LazyIterator
     * @param {Iterable<T>} source The source iterable
     */
    constructor(source) {
        this.operations = [];
        this.reversed = false;
        this.source = source;
    }
    /**
     * Implements the Iterator protocol
     * @returns {Iterator<T>} An iterator over the elements
     */
    [Symbol.iterator]() {
        return this.evaluate();
    }
    /**
     * Transforms each element using the provided function
     * @template U The type of the transformed elements
     * @param {MapFn<T, U>} fn The transformation function
     * @returns {LazyIterator<U>} A new iterator with transformed elements
     */
    map(fn) {
        this.operations.push((value) => option_js_1.Option.some(fn(value)));
        return this;
    }
    /**
     * Filters elements based on a predicate
     * @param {FilterFn<T>} fn The predicate function
     * @returns {LazyIterator<T>} A new iterator with filtered elements
     */
    filter(fn) {
        this.operations.push((value) => (fn(value) ? option_js_1.Option.some(value) : option_js_1.Option.none()));
        return this;
    }
    /**
     * Combines filtering and mapping in a single operation
     * @template U The type of the transformed elements
     * @param {FilterMapFn<T, U>} fn The filter-map function
     * @returns {LazyIterator<U>} A new iterator with transformed elements
     */
    filterMap(fn) {
        this.operations.push(fn);
        return this;
    }
    /**
     * Takes the first n elements from the iterator
     * @param {number} n The number of elements to take
     * @returns {LazyIterator<T>} A new iterator with at most n elements
     */
    take(n) {
        if (n <= 0) {
            return new LazyIterator([]);
        }
        return new LazyIterator(function* () {
            let count = 0;
            for (const value of this.source) {
                if (count === n) {
                    break;
                }
                let current = option_js_1.Option.some(value);
                for (const op of this.operations) {
                    current = current.andThen(op);
                    if (current.isNone()) {
                        break;
                    }
                }
                if (current.isSome()) {
                    yield current.unwrap();
                    count++;
                }
            }
        }.call(this));
    }
    /**
     * Skips the first n elements of the iterator
     * @param {number} n The number of elements to skip
     * @returns {LazyIterator<T>} A new iterator starting after the skipped elements
     */
    skip(n) {
        let count = 0;
        this.operations.push((value) => (count++ < n ? option_js_1.Option.none() : option_js_1.Option.some(value)));
        return this;
    }
    /**
     * Returns the nth element of the iterator
     * @param {number} n The index of the element to return
     * @returns {Option<T>} The nth element, if it exists
     */
    nth(n) {
        const entry = this.skip(n).take(1).collect().ok();
        const valueArr = entry.unwrapOr([]);
        return valueArr.length > 0 ? option_js_1.Option.some(valueArr[0]) : option_js_1.Option.none();
    }
    /**
     * Returns the last element of the iterator
     * @returns {Option<T>} The last element, if it exists
     */
    last() {
        return this.reduce((_, curr) => curr);
    }
    /**
     * Reverses the order of elements in the iterator
     * @returns {LazyIterator<T>} A new iterator with reversed elements
     */
    reverse() {
        this.reversed = !this.reversed;
        return this;
    }
    /**
     * Performs a side effect for each element without modifying the iterator
     * @param {TapFn<T>} fn The function to execute for each element
     * @returns {LazyIterator<T>} The same iterator for chaining
     */
    tap(fn) {
        this.operations.push((value) => {
            fn(value);
            return option_js_1.Option.some(value);
        });
        return this;
    }
    /**
     * Prints each element for debugging purposes
     * @param {string} prefix Optional prefix to add before each element
     * @returns {LazyIterator<T>} The same iterator for chaining
     */
    debug(prefix = "") {
        return this.tap((value) => console.log(`${prefix}${value}`));
    }
    /**
     * Groups elements into chunks of the specified size
     * @param {number} size The size of each chunk
     * @returns {Result<LazyIterator<T[]>, IterNegativeNumberError>} A Result containing either a new iterator of chunks or an error
     */
    chunk(size) {
        if (size <= 0) {
            return result_js_1.Result.err(new IterNegativeNumberError("Chunk size must be positive"));
        }
        return result_js_1.Result.ok(new LazyIterator(function* () {
            let chunk = [];
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
        }.call(this)));
    }
    /**
     * Counts the number of elements in the iterator
     * @returns {number} The number of elements
     */
    count() {
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
    zip(other) {
        const self = this;
        return new LazyIterator((function* () {
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
        })());
    }
    /**
     * Splits an iterator of pairs into a pair of arrays
     * @template T The type of the first element in each pair
     * @template U The type of the second element in each pair
     * @returns {Result<[T[], U[]], IterUnzipError>} A Result containing either the unzipped arrays or an error
     */
    unzip() {
        try {
            const first = [];
            const second = [];
            for (const [a, b] of this) {
                first.push(a);
                second.push(b);
            }
            return result_js_1.Result.ok([first, second]);
        }
        catch (e) {
            return result_js_1.Result.err(new IterUnzipError(e instanceof Error ? e.message : "Failed to unzip"));
        }
    }
    /**
     * Groups elements by a key function
     * @template K The type of the keys
     * @param {(value: T) => K} keyFn Function to generate keys
     * @returns {Result<Map<K, T[]>, IterGroupByError>} A Result containing either a Map of grouped elements or an error
     */
    groupBy(keyFn) {
        var _a;
        try {
            const groups = new Map();
            for (const value of this) {
                const key = keyFn(value);
                const group = (_a = groups.get(key)) !== null && _a !== void 0 ? _a : [];
                group.push(value);
                groups.set(key, group);
            }
            return result_js_1.Result.ok(groups);
        }
        catch (e) {
            return result_js_1.Result.err(new IterGroupByError(e instanceof Error ? e.message : "Failed to groupBy"));
        }
    }
    /**
     * Sorts elements using a comparison function
     * @param {CompareFn<T>} compareFn The comparison function
     * @returns {Result<LazyIterator<T>, IterSortByError>} A Result containing either a new sorted iterator or an error
     */
    sortBy(compareFn) {
        try {
            const sorted = [...this].sort(compareFn);
            return result_js_1.Result.ok(new LazyIterator(sorted));
        }
        catch (e) {
            return result_js_1.Result.err(new IterSortByError(e instanceof Error ? e.message : "Failed to sortBy"));
        }
    }
    /**
     * Finds the first element matching a predicate
     * @param {FilterFn<T>} predicate The predicate function
     * @returns {Option<T>} The first matching element, if any
     */
    find(predicate) {
        for (const value of this) {
            if (predicate(value)) {
                return option_js_1.Option.some(value);
            }
        }
        return option_js_1.Option.none();
    }
    /**
     * Finds the position of the first element matching a predicate
     * @param {FilterFn<T>} predicate The predicate function
     * @returns {Option<number>} The position of the first matching element, if any
     */
    position(predicate) {
        let index = 0;
        for (const value of this) {
            if (predicate(value)) {
                return option_js_1.Option.some(index);
            }
            index++;
        }
        return option_js_1.Option.none();
    }
    /**
     * Tests if any element satisfies the predicate
     * @param {FilterFn<T>} predicate The predicate function
     * @returns {boolean} True if any element satisfies the predicate
     */
    some(predicate) {
        return this.find(predicate).isSome();
    }
    /**
     * Tests if all elements satisfy the predicate
     * @param {FilterFn<T>} predicate The predicate function
     * @returns {boolean} True if all elements satisfy the predicate
     */
    all(predicate) {
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
    reduce(fn) {
        const iterator = this[Symbol.iterator]();
        const first = iterator.next();
        if (first.done) {
            return option_js_1.Option.none();
        }
        let result = first.value;
        while (true) {
            const next = iterator.next();
            if (next.done) {
                break;
            }
            result = fn(result, next.value);
        }
        return option_js_1.Option.some(result);
    }
    /**
     * Folds the iterator into a single value using a provided initial value
     * @template U The type of the accumulated value
     * @param {FoldFn<T, U>} fn The folding function
     * @param {U} initial The initial value
     * @returns {Result<U, IterFoldError>} A Result containing either the folded value or an error
     */
    fold(fn, initial) {
        try {
            let result = initial;
            for (const value of this) {
                result = fn(result, value);
            }
            return result_js_1.Result.ok(result);
        }
        catch (e) {
            return result_js_1.Result.err(new IterFoldError(e instanceof Error ? e.message : "Failed to fold"));
        }
    }
    /**
     * Collects all elements into an array
     * @returns {Result<T[], IterCollectError>} A Result containing either an array of elements or an error
     */
    collect() {
        try {
            const result = Array.from(this.evaluate());
            return result_js_1.Result.ok(this.reversed ? result.reverse() : result);
        }
        catch (e) {
            return result_js_1.Result.err(new IterCollectError(e instanceof Error ? e.message : "Failed to collect"));
        }
    }
    /**
     * Internal generator function that evaluates the iterator chain
     * @private
     * @returns {Generator<T>} A generator of the transformed elements
     */
    *evaluate() {
        for (const value of this.source) {
            let current = option_js_1.Option.some(value);
            for (const op of this.operations) {
                current = current.andThen(op);
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
class IterNegativeNumberError extends error_js_1.TaggedError {
    constructor() {
        super(...arguments);
        this._tag = "IterNegativeNumberError";
    }
}
exports.IterNegativeNumberError = IterNegativeNumberError;
/**
 * Error thrown when collecting a LazyIterator
 */
class IterCollectError extends error_js_1.TaggedError {
    constructor() {
        super(...arguments);
        this._tag = "IterCollectError";
    }
}
exports.IterCollectError = IterCollectError;
/**
 * Error thrown when unzipping anLazyIterator
 */
class IterUnzipError extends error_js_1.TaggedError {
    constructor() {
        super(...arguments);
        this._tag = "IterUnzipError";
    }
}
exports.IterUnzipError = IterUnzipError;
/**
 * Error thrown when groupBy fails for a LazyIterator
 */
class IterGroupByError extends error_js_1.TaggedError {
    constructor() {
        super(...arguments);
        this._tag = "IterGroupByError";
    }
}
exports.IterGroupByError = IterGroupByError;
/**
 * Error thrown when sortBy fails for a LazyIterator
 */
class IterSortByError extends error_js_1.TaggedError {
    constructor() {
        super(...arguments);
        this._tag = "IterSortByError";
    }
}
exports.IterSortByError = IterSortByError;
/**
 * Error thrown when fold fails for a LazyIterator
 */
class IterFoldError extends error_js_1.TaggedError {
    constructor() {
        super(...arguments);
        this._tag = "IterFoldError";
    }
}
exports.IterFoldError = IterFoldError;