var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { TaggedError } from "./error.js";
import { isNonNullable } from "./utils.js";
import { Option } from "./option.js";
// NOTE: exporting this object allows use to use try as a function
// when it is a reserved keyword, can use like `Result.try`
export const Result = {
    /**
     * Creates an Ok result.
     * @template T The type of the value.
     * @param {T} value The value to wrap in Ok.
     * @returns {Ok<T>} An Ok result containing the value.
     */
    ok(value) {
        return new Ok(value);
    },
    /**
     * Creates an Err result.
     * @template E The type of the error.
     * @param {E} error The error to wrap in Err.
     * @returns {Err<E>} An Err result containing the error.
     */
    err(error) {
        return new Err(error);
    },
    /**
     * Checks if a value is an instance of Result.
     * @template T The type of the Ok value.
     * @template E The type of the Err value.
     * @param {unknown} value The value to check.
     * @returns {boolean} True if the value is a Result, false otherwise.
     */
    isResult(value) {
        return value instanceof Ok || value instanceof Err;
    },
    /**
     * Creates a Result for the provided Nullable value.
     * @template T The type of the value.
     * @param {T} value The value to put in the Result.
     * @returns {Result<T, E>} An Ok with value, or an Err result containing an error string.
     */
    fromNullable(value) {
        return isNonNullable(value) ? Result.ok(value) : Result.err("The value provided was Nullable");
    },
    /**
     * Creates a Result for the provided Nullable value.
     * @template T The type of the value.
     * @param {T} value The value to put in the Result.
     * @returns {Result<T, E>} An Ok with value, or an Err result containing an error string.
     */
    fromNullableWithError(value, error) {
        if (isNonNullable(value)) {
            return Result.ok(value);
        }
        else if (isNonNullable(error)) {
            return Result.err(error);
        }
        else {
            throw new ResultNonNullableError("Both provided values are Nullable and a Result cannot be created");
        }
    },
    /**
     * Attempts to execute a function and returns the result in a `Result` type.
     *
     * If the function executes successfully, returns `Ok` with the result.
     * If the function throws an error, returns `Err` as an `Error`
     *
     * @template T - The type of the result.
     * @param {() => T} fn - The function to attempt to execute.
     * @returns {Result<T, Error>} The result of the function execution.
     */
    try(fn) {
        try {
            return Result.fromNullableWithError(fn(), new Error(""));
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : "An error was thrown during a Result.try call";
            return Result.err(new Error(msg));
        }
    },
    /**
     * Attempts to execute an asynchronous function and returns the result in a `Result` type.
     *
     * If the function executes successfully, returns a `Result` containing the value.
     * If the function throws an error, returns a `Result` containing an `Error` with the original error as the cause.
     *
     * @template T - The type of the result.
     * @param {() => Promise<T>} fn - The asynchronous function to attempt to execute.
     * @returns {Promise<Result<T, Error>>} A promise that resolves to the result of the function execution.
     */
    asyncTry(fn) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return Result.fromNullableWithError(yield fn(), new Error(""));
            }
            catch (e) {
                const msg = e instanceof Error ? e.message : "An error was thrown during a Result.try call";
                return Result.err(new Error(msg));
            }
        });
    },
};
/**
 * Represents a successful result.
 * @template T The type of the contained success value.
 */
class Ok {
    /**
     * Creates an instance of Ok.
     *
     * @param {T} value - The success value.
     */
    constructor(value) {
        this.value = value;
        /**
         * A constant tag to identify this instance as "Ok".
         */
        this._tag = "Ok";
    }
    /**
     * Checks if the Result is Ok.
     * @returns {boolean} True if the Result is Ok, false otherwise.
     */
    isOk() {
        return true;
    }
    /**
     * Checks if the Result is Err.
     * @returns {boolean} Always false for Ok.
     */
    isErr() {
        return false;
    }
    /**
     * Checks if the Result is Ok and the value satisfies a predicate.
     * @param {(value: T) => boolean} pred The predicate function.
     * @returns {boolean} True if the Result is Ok and the predicate returns true, false otherwise.
     */
    isOkAnd(pred) {
        return pred(this.value);
    }
    /**
     * Checks if the Result is Err and the error satisfies a predicate.
     * @param {(error: never) => boolean} _pred The predicate function (unused for Ok).
     * @returns {boolean} Always false for Ok.
     */
    isErrAnd(_pred) {
        return false;
    }
    /**
     * Unwraps the Result, returning the contained Ok value.
     * @returns {T} The contained value.
     */
    unwrap() {
        return this.value;
    }
    /**
     * Returns the contained Ok value or a provided default.
     * @param {T} _defaultValue The default value (unused for Ok).
     * @returns {T} The contained value.
     */
    unwrapOr(_defaultValue) {
        return this.value;
    }
    /**
     * Unwraps the Result, expecting Err and throwing if Ok.
     * @throws {ResultUnwrapError} Always throws for Ok.
     */
    unwrapErr() {
        throw new ResultUnwrapError("Called `unwrapErr` on an `Ok` value");
    }
    /**
     * Returns the contained Ok value or computes it from a provided function.
     * @param {(error: never) => T} _fn The function to compute a default value (unused for Ok).
     * @returns {T} The contained value.
     */
    unwrapOrElse(_fn) {
        return this.value;
    }
    /**
     * Returns the provided Result if this Result is Ok, otherwise returns the Err value.
     * @template U The type of the new Ok value.
     * @template F The type of the new Err value.
     * @param {Result<U, F>} other The Result to return if this is Ok.
     * @returns {Result<U, F>} The provided Result.
     */
    and(other) {
        return other;
    }
    /**
     * Calls the provided function with the contained value and returns the result if this Result is Ok.
     * @template U The type of the new Ok value.
     * @template F The type of the new Err value.
     * @param {(value: T) => Result<U, F>} fn The function to call with the contained value.
     * @returns {Result<U, F>} The Result returned by the provided function.
     */
    andThen(fn) {
        return fn(this.value);
    }
    /**
     * Maps a Result<T, E> to Result<U, E> by applying a function to the contained Ok value.
     * @template U The type of the new Ok value.
     * @param {(value: T) => U} fn The function to apply to the contained value.
     * @returns {Result<U, never>} A new Result with the function applied to the contained value.
     */
    map(fn) {
        return new Ok(fn(this.value));
    }
    /**
     * Maps a Result<T, E> to Result<T, F> by applying a function to the contained Err value.
     * @template F The type of the new Err value.
     * @param {(error: never) => F} _fn The function to apply to the error (unused for Ok).
     * @returns {Result<T, F>} The original Ok Result with an updated type.
     */
    mapErr(_fn) {
        return this;
    }
    /**
     * Applies a function to the contained value (if Ok), or a fallback function to the error value (if Err).
     * @template U The type of the return value.
     * @param {(error: never) => U} _onErr The function to apply to the error (unused for Ok).
     * @param {(value: T) => U} onOk The function to apply to the contained value.
     * @returns {U} The result of applying onOk to the contained value.
     */
    mapOrElse(_onErr, onOk) {
        return onOk(this.value);
    }
    /**
     * Converts from Result<Result<U, E>, E> to Result<U, E>
     * @template U The type of the inner Ok value.
     * @returns {Result<U, never>} The flattened Result.
     */
    flatten() {
        return this.value;
    }
    /**
     * Calls the provided function with the contained value and returns self.
     * @param {(value: T) => void} fn The function to call with the contained value.
     * @returns {this} Returns the original Result.
     */
    inspect(fn) {
        fn(this.value);
        return this;
    }
    /**
     * Calls the provided function with the contained error and returns self.
     * @param {(error: never) => void} _fn The function to call with the error (unused for Ok).
     * @returns {this} Returns the original Result.
     */
    inspectErr(_fn) {
        return this;
    }
    /**
     * Returns the Ok if it contains a value, otherwise returns an Err.
     * @param {Result<U, F>} _other The alternative Result (ignored in Ok).
     * @returns {Result<T, never>} This Ok instance.
     */
    or(_other) {
        return this;
    }
    /**
     * Converts an Ok<T> to a None
     * @returns {Option<T>} The Option containing the value.
     */
    err() {
        return Option.none();
    }
    /**
     * Converts an Ok<T> to a Some<T>
     * @returns {Option<T>} The Option containing the value.
     */
    ok() {
        return Option.fromNullable(this.value);
    }
}
/**
 * Represents an error result.
 * @template E The type of the contained error value.
 */
class Err {
    /**
     * Creates an instance of Err.
     *
     * @param {E} error - The error value.
     */
    constructor(error) {
        this.error = error;
        /**
         * A constant tag to identify this instance as "Err".
         */
        this._tag = "Err";
    }
    /**
     * Checks if the Result is Ok.
     * @returns {boolean} Always false for Err.
     */
    isOk() {
        return false;
    }
    /**
     * Checks if the Result is Err.
     * @returns {boolean} Always true for Err.
     */
    isErr() {
        return true;
    }
    /**
     * Checks if the Result is Ok and the value satisfies a predicate.
     * @param {(value: E) => boolean} _pred The predicate function (unused for Err).
     * @returns {boolean} Always false for Err.
     */
    isOkAnd(_pred) {
        return false;
    }
    /**
     * Checks if the Result is Err and the error satisfies a predicate.
     * @param {(error: E) => boolean} pred The predicate function.
     * @returns {boolean} True if the predicate returns true, false otherwise.
     */
    isErrAnd(pred) {
        return pred(this.error);
    }
    /**
     * Unwraps the Result, expecting Ok and throwing if Err.
     * @throws {ResultUnwrapError} Always throws for Err.
     */
    unwrap() {
        throw new ResultUnwrapError("Called `unwrap` on an `Err` value");
    }
    /**
     * Returns the provided default value if Err, or the contained value if Ok.
     * @template T The type of the Ok value.
     * @param {T} defaultValue The default value to return.
     * @returns {T} The provided default value.
     */
    unwrapOr(defaultValue) {
        return defaultValue;
    }
    /**
     * Unwraps the Result, returning the contained Err value.
     * @returns {E} The contained error.
     */
    unwrapErr() {
        return this.error;
    }
    /**
     * Returns the contained Ok value or computes it from a provided function.
     * @template T The type of the Ok value.
     * @param {(error: E) => T} fn The function to compute the value.
     * @returns {T} The result of applying fn to the contained error.
     */
    unwrapOrElse(fn) {
        return fn(this.error);
    }
    /**
     * Returns the provided Result if this Result is Ok, otherwise returns the Err value.
     * @template U The type of the new Ok value.
     * @template F The type of the new Err value.
     * @param {Result<U, F>} _other The Result to return if this is Ok (unused for Err).
     * @returns {Result<U, F>} The original Err Result with an updated type.
     */
    and(_other) {
        return this;
    }
    /**
     * Calls the provided function with the contained value and returns the result if this Result is Ok.
     * @template U The type of the new Ok value.
     * @template F The type of the new Err value.
     * @param {(value: never) => Result<U, F>} _fn The function to call (unused for Err).
     * @returns {Result<U, F>} The original Err Result with an updated type.
     */
    andThen(_fn) {
        return this;
    }
    /**
     * Maps a Result<T, E> to Result<U, E> by applying a function to the contained Ok value.
     * @template U The type of the new Ok value.
     * @param {(value: never) => U} _fn The function to apply (unused for Err).
     * @returns {Result<U, E>} The original Err Result with an updated type.
     */
    map(_fn) {
        return this;
    }
    /**
     * Maps a Result<T, E> to Result<T, F> by applying a function to the contained Err value.
     * @template F The type of the new Err value.
     * @param {(error: E) => F} fn The function to apply to the error.
     * @returns {Result<never, F>} A new Err Result with the function applied to the contained error.
     */
    mapErr(fn) {
        return new Err(fn(this.error));
    }
    /**
     * Applies a function to the contained value (if Ok), or a fallback function to the error value (if Err).
     * @template F The type of the return value.
     * @param {(error: E) => F} onErr The function to apply to the error.
     * @param {(value: never) => F} _onOk The function to apply to the value (unused for Err).
     * @returns {F} The result of applying onErr to the contained error.
     */
    mapOrElse(onErr, _onOk) {
        return onErr(this.error);
    }
    /**
     * Converts from Result<Result<U, E>, E> to Result<U, E>
     * @template U The type of the inner Ok value.
     * @returns {Result<U, E>} The original Err Result with an updated type.
     */
    flatten() {
        return this;
    }
    /**
     * Calls the provided function with the contained value and returns self.
     * @param {(value: never) => void} _fn The function to call (unused for Err).
     * @returns {this} Returns the original Result.
     */
    inspect(_fn) {
        return this;
    }
    /**
     * Calls the provided function with the contained error and returns self.
     * @param {(error: E) => void} fn The function to call with the error.
     * @returns {this} Returns the original Result.
     */
    inspectErr(fn) {
        fn(this.error);
        return this;
    }
    /**
     * Returns the Ok if it contains a value, otherwise returns an Err.
     * @param {Result<U, F>} other The alternative Result.
     * @returns {Result<U, F>} The other Result.
     */
    or(other) {
        return other;
    }
    /**
     * Converts an Err<E> to a Some<E>
     * @returns {Option<E>} The Option containing the error.
     */
    err() {
        return Option.fromNullable(this.error);
    }
    /**
     * Converts an Err<E> to a None
     * @returns {Option<E>} The Option containing the error.
     */
    ok() {
        return Option.none();
    }
}
/**
 * Error thrown when unwrapping a Result fails.
 * @extends TaggedError
 */
export class ResultUnwrapError extends TaggedError {
    constructor() {
        super(...arguments);
        this._tag = "ResultUnwrapError";
    }
}
/**
 * Error thrown when creating a NonNullable Result fails.
 * @extends TaggedError
 */
export class ResultNonNullableError extends TaggedError {
    constructor() {
        super(...arguments);
        this._tag = "ResultNonNullableError ";
    }
}
