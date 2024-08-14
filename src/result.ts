import { TaggedError } from "./error";
import { isNonNullable } from "./utils";
import { Option } from "./option";

// NOTE: exporting this object allows use to use try as a function
// when it is a reserved keyword, can use like `Result.try`
export const Result = {
  /**
   * Creates an Ok result.
   * @template T The type of the value.
   * @param {T} value The value to wrap in Ok.
   * @returns {Ok<T>} An Ok result containing the value.
   */
  ok<T>(value: T): Ok<T> {
    return new Ok(value);
  },

  /**
   * Creates an Err result.
   * @template E The type of the error.
   * @param {E} error The error to wrap in Err.
   * @returns {Err<E>} An Err result containing the error.
   */
  err<E>(error: E): Err<E> {
    return new Err(error);
  },

  /**
   * Creates a Result for the provided Nullable value.
   * @template T The type of the value.
   * @param {T} value The value to put in the Result.
   * @returns {Result<T, E>} An Ok with value, or an Err result containing an error string.
   */
  fromNullable<T>(value: T): Result<T, string> {
    return isNonNullable(value)
      ? Result.ok(value as NonNullable<T>)
      : Result.err("The value provided was Nullable");
  },

  /**
   * Creates a Result for the provided Nullable value.
   * @template T The type of the value.
   * @param {T} value The value to put in the Result.
   * @returns {Result<T, E>} An Ok with value, or an Err result containing an error string.
   */
  fromNullableWithError<T, E>(value: T, error: E): Result<T, E> {
    if (isNonNullable(value)) {
      return Result.ok(value as NonNullable<T>);
    } else if (isNonNullable(error)) {
      return Result.err(error as NonNullable<E>);
    } else {
      throw new ResultNonNullableError(
        "Both provided values are Nullable and a Result cannot be created",
      );
    }
  },

  /**
   * Attempts to execute a function and returns the result in a `Result` type.
   *
   * If the function executes successfully, returns `Ok` with the result.
   * If the function throws an error, returns `Err` with a `TryCatchError` containing the cause.
   *
   * @template T - The type of the result.
   * @param {() => T} fn - The function to attempt to execute.
   * @returns {Result<T, TryCatchError>} The result of the function execution.
   */
  try<T>(fn: () => T): Result<T, TryCatchError> {
    try {
      const res = fn();
      return Result.fromNullableWithError(res, new TryCatchError("", {}));
    } catch (e) {
      return Result.err(
        new TryCatchError("An error was thrown during a Result.try call", {
          cause: e,
        }),
      );
    }
  },

  /**
   * Attempts to execute an asynchronous function and returns the result in a `Result` type.
   *
   * If the function executes successfully, returns a `Result` containing the value.
   * If the function throws an error, returns a `Result` containing a `TryCatchError` with the original error as the cause.
   *
   * @template T - The type of the result.
   * @param {() => Promise<T>} fn - The asynchronous function to attempt to execute.
   * @returns {Promise<Result<T, TryCatchError>>} A promise that resolves to the result of the function execution.
   */
  async asyncTry<T>(fn: () => Promise<T>): Promise<Result<T, TryCatchError>> {
    try {
      const res = await fn();
      return Result.fromNullableWithError(res, new TryCatchError("", {}));
    } catch (e) {
      return Result.err(
        new TryCatchError("An error was thrown during a Result.try call", {
          cause: e,
        }),
      );
    }
  },
};

/**
 * Represents a value that is either Ok or Err.
 * @template T The type of the value in case of Ok.
 * @template E The type of the error in case of Err.
 */
export type Result<T, E> = Ok<T> | Err<E>;

/**
 * Represents a successful result.
 * @template T The type of the contained success value.
 */
class Ok<T> {
  /**
   * A constant tag to identify this instance as "Ok".
   */
  readonly _tag = "Ok" as const;

  /**
   * Creates an instance of Ok.
   *
   * @param {T} value - The success value.
   */
  constructor(private readonly value: T) { }

  /**
   * Checks if the Result is Ok.
   * @returns {boolean} True if the Result is Ok, false otherwise.
   */
  isOk(): this is Ok<T> {
    return true;
  }

  /**
   * Checks if the Result is Err.
   * @returns {boolean} Always false for Ok.
   */
  isErr(): this is Err<never> {
    return false;
  }

  /**
   * Checks if the Result is Ok and the value satisfies a predicate.
   * @param {(value: T) => boolean} pred The predicate function.
   * @returns {boolean} True if the Result is Ok and the predicate returns true, false otherwise.
   */
  isOkAnd(pred: (value: T) => boolean): boolean {
    return pred(this.value);
  }

  /**
   * Checks if the Result is Err and the error satisfies a predicate.
   * @param {(error: never) => boolean} _pred The predicate function (unused for Ok).
   * @returns {boolean} Always false for Ok.
   */
  isErrAnd(_pred: (error: never) => boolean): boolean {
    return false;
  }

  /**
   * Unwraps the Result, returning the contained Ok value.
   * @returns {T} The contained value.
   */
  unwrap(): T {
    return this.value;
  }

  /**
   * Returns the contained Ok value or a provided default.
   * @param {T} _defaultValue The default value (unused for Ok).
   * @returns {T} The contained value.
   */
  unwrapOr(_defaultValue: T): T {
    return this.value;
  }

  /**
   * Unwraps the Result, expecting Err and throwing if Ok.
   * @throws {ResultUnwrapError} Always throws for Ok.
   */
  unwrapErr(): never {
    throw new ResultUnwrapError("Called `unwrapErr` on an `Ok` value");
  }

  /**
   * Returns the contained Ok value or computes it from a provided function.
   * @param {(error: never) => T} _fn The function to compute a default value (unused for Ok).
   * @returns {T} The contained value.
   */
  unwrapOrElse(_fn: (error: never) => T): T {
    return this.value;
  }

  /**
   * Returns the provided Result if this Result is Ok, otherwise returns the Err value.
   * @template U The type of the new Ok value.
   * @template F The type of the new Err value.
   * @param {Result<U, F>} other The Result to return if this is Ok.
   * @returns {Result<U, F>} The provided Result.
   */
  and<U, F>(other: Result<U, F>): Result<U, F> {
    return other;
  }

  /**
   * Calls the provided function with the contained value and returns the result if this Result is Ok.
   * @template U The type of the new Ok value.
   * @template F The type of the new Err value.
   * @param {(value: T) => Result<U, F>} fn The function to call with the contained value.
   * @returns {Result<U, F>} The Result returned by the provided function.
   */
  andThen<U, F>(fn: (value: T) => Result<U, F>): Result<U, F> {
    return fn(this.value);
  }

  /**
   * Maps a Result<T, E> to Result<U, E> by applying a function to the contained Ok value.
   * @template U The type of the new Ok value.
   * @param {(value: T) => U} fn The function to apply to the contained value.
   * @returns {Result<U, never>} A new Result with the function applied to the contained value.
   */
  map<U>(fn: (value: T) => U): Result<U, never> {
    return new Ok(fn(this.value));
  }

  /**
   * Maps a Result<T, E> to Result<T, F> by applying a function to the contained Err value.
   * @template F The type of the new Err value.
   * @param {(error: never) => F} _fn The function to apply to the error (unused for Ok).
   * @returns {Result<T, F>} The original Ok Result with an updated type.
   */
  mapErr<F>(_fn: (error: never) => F): Result<T, F> {
    return this as unknown as Result<T, F>;
  }

  /**
   * Applies a function to the contained value (if Ok), or a fallback function to the error value (if Err).
   * @template U The type of the return value.
   * @param {(error: never) => U} _onErr The function to apply to the error (unused for Ok).
   * @param {(value: T) => U} onOk The function to apply to the contained value.
   * @returns {U} The result of applying onOk to the contained value.
   */
  mapOrElse<U>(_onErr: (error: never) => U, onOk: (value: T) => U): U {
    return onOk(this.value);
  }

  /**
   * Converts from Result<Result<U, E>, E> to Result<U, E>
   * @template U The type of the inner Ok value.
   * @returns {Result<U, never>} The flattened Result.
   */
  flatten<U>(this: Ok<Result<U, never>>): Result<U, never> {
    return this.value;
  }

  /**
   * Calls the provided function with the contained value and returns self.
   * @param {(value: T) => void} fn The function to call with the contained value.
   * @returns {this} Returns the original Result.
   */
  inspect(fn: (value: T) => void): this {
    fn(this.value);
    return this;
  }

  /**
   * Calls the provided function with the contained error and returns self.
   * @param {(error: never) => void} _fn The function to call with the error (unused for Ok).
   * @returns {this} Returns the original Result.
   */
  inspectErr(_fn: (error: never) => void): this {
    return this;
  }

  /**
   * Returns the Ok if it contains a value, otherwise returns an Err.
   * @param {Result<U, F>} _other The alternative Result (ignored in Ok).
   * @returns {Result<T, never>} This Ok instance.
   */
  or<U, F>(_other: Result<U, F>): Result<T, never> {
    return this;
  }

  /**
   * Converts an Ok<T> to a None
   * @returns {Option<T>} The Option containing the value.
   */
  err(): Option<T> {
    return Option.none();
  }

  /**
   * Converts an Ok<T> to a Some<T>
   * @returns {Option<T>} The Option containing the value.
   */
  ok(): Option<T> {
    return Option.fromNullable(this.value);
  }
}

/**
 * Represents an error result.
 * @template E The type of the contained error value.
 */
class Err<E> {
  /**
   * A constant tag to identify this instance as "Err".
   */
  readonly _tag = "Err" as const;

  /**
   * Creates an instance of Err.
   *
   * @param {E} error - The error value.
   */
  constructor(private readonly error: E) { }

  /**
   * Checks if the Result is Ok.
   * @returns {boolean} Always false for Err.
   */
  isOk(): this is Ok<never> {
    return false;
  }

  /**
   * Checks if the Result is Err.
   * @returns {boolean} Always true for Err.
   */
  isErr(): this is Err<E> {
    return true;
  }

  /**
   * Checks if the Result is Ok and the value satisfies a predicate.
   * @param {(value: E) => boolean} _pred The predicate function (unused for Err).
   * @returns {boolean} Always false for Err.
   */
  isOkAnd(_pred: (value: E) => boolean): boolean {
    return false;
  }

  /**
   * Checks if the Result is Err and the error satisfies a predicate.
   * @param {(error: E) => boolean} pred The predicate function.
   * @returns {boolean} True if the predicate returns true, false otherwise.
   */
  isErrAnd(pred: (error: E) => boolean): boolean {
    return pred(this.error);
  }

  /**
   * Unwraps the Result, expecting Ok and throwing if Err.
   * @throws {ResultUnwrapError} Always throws for Err.
   */
  unwrap(): never {
    throw new ResultUnwrapError("Called `unwrap` on an `Err` value");
  }

  /**
   * Returns the provided default value if Err, or the contained value if Ok.
   * @template T The type of the Ok value.
   * @param {T} defaultValue The default value to return.
   * @returns {T} The provided default value.
   */
  unwrapOr<T>(defaultValue: T): T {
    return defaultValue;
  }

  /**
   * Unwraps the Result, returning the contained Err value.
   * @returns {E} The contained error.
   */
  unwrapErr(): E {
    return this.error;
  }

  /**
   * Returns the contained Ok value or computes it from a provided function.
   * @template T The type of the Ok value.
   * @param {(error: E) => T} fn The function to compute the value.
   * @returns {T} The result of applying fn to the contained error.
   */
  unwrapOrElse<T>(fn: (error: E) => T): T {
    return fn(this.error);
  }

  /**
   * Returns the provided Result if this Result is Ok, otherwise returns the Err value.
   * @template U The type of the new Ok value.
   * @template F The type of the new Err value.
   * @param {Result<U, F>} _other The Result to return if this is Ok (unused for Err).
   * @returns {Result<U, F>} The original Err Result with an updated type.
   */
  and<U, F>(_other: Result<U, F>): Result<U, F> {
    return this as unknown as Result<U, F>;
  }

  /**
   * Calls the provided function with the contained value and returns the result if this Result is Ok.
   * @template U The type of the new Ok value.
   * @template F The type of the new Err value.
   * @param {(value: never) => Result<U, F>} _fn The function to call (unused for Err).
   * @returns {Result<U, F>} The original Err Result with an updated type.
   */
  andThen<U, F>(_fn: (value: never) => Result<U, F>): Result<U, F> {
    return this as unknown as Result<U, F>;
  }

  /**
   * Maps a Result<T, E> to Result<U, E> by applying a function to the contained Ok value.
   * @template U The type of the new Ok value.
   * @param {(value: never) => U} _fn The function to apply (unused for Err).
   * @returns {Result<U, E>} The original Err Result with an updated type.
   */
  map<U>(_fn: (value: never) => U): Result<U, E> {
    return this as unknown as Result<U, E>;
  }

  /**
   * Maps a Result<T, E> to Result<T, F> by applying a function to the contained Err value.
   * @template F The type of the new Err value.
   * @param {(error: E) => F} fn The function to apply to the error.
   * @returns {Result<never, F>} A new Err Result with the function applied to the contained error.
   */
  mapErr<F>(fn: (error: E) => F): Result<never, F> {
    return new Err(fn(this.error));
  }

  /**
   * Applies a function to the contained value (if Ok), or a fallback function to the error value (if Err).
   * @template F The type of the return value.
   * @param {(error: E) => F} onErr The function to apply to the error.
   * @param {(value: never) => F} _onOk The function to apply to the value (unused for Err).
   * @returns {F} The result of applying onErr to the contained error.
   */
  mapOrElse<F>(onErr: (error: E) => F, _onOk: (value: never) => F): F {
    return onErr(this.error);
  }

  /**
   * Converts from Result<Result<U, E>, E> to Result<U, E>
   * @template U The type of the inner Ok value.
   * @returns {Result<U, E>} The original Err Result with an updated type.
   */
  flatten<U>(): Result<U, E> {
    return this as unknown as Result<U, E>;
  }

  /**
   * Calls the provided function with the contained value and returns self.
   * @param {(value: never) => void} _fn The function to call (unused for Err).
   * @returns {this} Returns the original Result.
   */
  inspect(_fn: (value: never) => void): this {
    return this;
  }

  /**
   * Calls the provided function with the contained error and returns self.
   * @param {(error: E) => void} fn The function to call with the error.
   * @returns {this} Returns the original Result.
   */
  inspectErr(fn: (error: E) => void): this {
    fn(this.error);
    return this;
  }

  /**
   * Returns the Ok if it contains a value, otherwise returns an Err.
   * @param {Result<U, F>} other The alternative Result.
   * @returns {Result<U, F>} The other Result.
   */
  or<U, F>(other: Result<U, F>): Result<U, F> {
    return other;
  }

  /**
   * Converts an Err<E> to a Some<E>
   * @returns {Option<E>} The Option containing the error.
   */
  err(): Option<E> {
    return Option.fromNullable(this.error);
  }

  /**
   * Converts an Err<E> to a None
   * @returns {Option<E>} The Option containing the error.
   */
  ok(): Option<E> {
    return Option.none();
  }
}

/**
 * Error thrown when unwrapping a Result fails.
 * @extends TaggedError
 */
export class ResultUnwrapError extends TaggedError {
  readonly _tag = "ResultUnwrapError" as const;
}

/**
 * Error thrown when creating a NonNullable Result fails.
 * @extends TaggedError
 */
export class ResultNonNullableError extends TaggedError {
  readonly _tag = "ResultNonNullableError " as const;
}

/**
 * Error thrown when a try catch blocks has an error
 * @extends TaggedError
 */
export class TryCatchError extends TaggedError {
  readonly _tag = "TryCatchError" as const;
  cause?: unknown;

  /**
   * Creates a new TryCatchError instance.
   *
   * @param {string} message - The error message.
   * @param {Object} [options] - Optional options.
   * @param {unknown} [options.cause] - The cause of the error.
   */
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    if (options?.cause) {
      this.cause = options.cause;
    }
  }

  getMessage(): string {
    const cause = this.cause as { message: string };
    return cause.message;
  }
}
