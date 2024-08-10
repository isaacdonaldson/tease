import { TaggedError } from "./error";
import { isNonNullable } from "./utils";
import { Result } from "./result";

// NOTE: we are doing this to keep api consistent with Result
export const Option = {
  /**
   * Creates a Some instance containing a non-null value.
   * @template T The type of the value.
   * @param {NonNullable<T>} value The non-null value to wrap.
   * @returns {Some<T>} A new Some instance.
   */
  some<T>(value: NonNullable<T>): Some<T> {
    return new Some(value);
  },

  /**
   * Creates a None instance representing the absence of a value.
   * @returns {None} A new None instance.
   */
  none(): None {
    return new None();
  },

  /**
   * Creates an Option for the provided Nullable value, Some<T> if non null, None if null.
   * @template T The type of the value.
   * @param {T} value The value to put in the Option.
   * @returns {Option<T>} A Some with value, or a None if value is null.
   */
  fromNullable<T>(value: T | null | undefined): Option<T> {
    // FIX: This is causing a test case to not compile and I am not sure why
    return isNonNullable(value)
      ? Option.some(value as NonNullable<T>)
      : Option.none();
  },
};

/**
 * Represents either a Some value or None.
 * @template T The type of the value when present.
 */
export type Option<T> = Some<T> | None;

/**
 * Represents a container for a non-null value.
 * @template T The type of the contained value.
 */
class Some<T> {
  readonly _tag = "Some" as const;

  /**
   * @param {NonNullable<T>} value The non-null value to store.
   */
  constructor(private readonly value: NonNullable<T>) { }

  /**
   * Checks if the Option is a Some value.
   * @returns {boolean} Always true for Some.
   */
  isSome(): boolean {
    return true;
  }

  /**
   * Checks if the Option is a None value.
   * @returns {boolean} Always false for Some.
   */
  isNone(): boolean {
    return false;
  }

  /**
   * Checks if the Option is Some and the value satisfies a predicate.
   * @param {(value: T) => boolean} pred The predicate function.
   * @returns {boolean} True if the predicate returns true, false otherwise.
   */
  isSomeAnd(pred: (value: T) => boolean): boolean {
    return pred(this.value);
  }

  /**
   * Unwraps the Option, returning the contained value.
   * @returns {T} The contained value.
   */
  unwrap(): T {
    return this.value;
  }

  /**
   * Returns the contained value or a default.
   * @param {T} _defaultValue The default value (unused in Some).
   * @returns {T} The contained value.
   */
  unwrapOr(_defaultValue: T): T {
    return this.value;
  }

  /**
   * Returns the contained value or computes it from a closure.
   * @param {() => T} _fn The closure to compute a default value (unused in Some).
   * @returns {T} The contained value.
   */
  unwrapOrElse(_fn: () => T): T {
    return this.value;
  }

  /**
   * Returns None if the option is None, otherwise returns other.
   * @template U The type of the other Option.
   * @param {Option<U>} other The other Option to return if this is Some.
   * @returns {Option<U>} The other Option.
   */
  and<U>(other: Option<U>): Option<U> {
    return other;
  }

  /**
   * Returns None if the option is None, otherwise calls fn with the wrapped value and returns the result.
   * @template U The type of the returned Option.
   * @param {(value: T) => Option<U>} fn The function to apply to the wrapped value.
   * @returns {Option<U>} The result of applying fn to the wrapped value.
   */
  andThen<U>(fn: (value: T) => Option<U>): Option<U> {
    return fn(this.value);
  }

  /**
   * Maps a Some value to a new Some value by applying a function to the contained value.
   * @template U The type of the new Option.
   * @param {(value: T) => NonNullable<U>} fn The function to apply to the contained value.
   * @returns {Option<U>} A new Some containing the result of fn.
   */
  map<U>(fn: (value: T) => NonNullable<U>): Option<U> {
    return Option.some(fn(this.value));
  }

  /**
   * Applies a function to the contained value (if Some), or computes a default (if None).
   * @template U The type of the result.
   * @param {() => U} _onNone The function to compute a default value (unused in Some).
   * @param {(value: T) => U} onSome The function to apply to the contained value.
   * @returns {U} The result of applying onSome to the contained value.
   */
  mapOrElse<U>(_onNone: () => U, onSome: (value: T) => U): U {
    return onSome(this.value);
  }

  /**
   * Returns None if the option is None, otherwise calls pred with the wrapped value and returns:
   * - Some(t) if pred returns true (where t is the wrapped value)
   * - None if pred returns false
   * @param {(value: T) => boolean} pred The predicate function.
   * @returns {Option<T>} Some if the predicate is true, None otherwise.
   */
  filter(pred: (value: T) => boolean): Option<T> {
    return pred(this.value) ? this : Option.none();
  }

  /**
   * Converts from Option<Option<T>> to Option<T>.
   * @returns {Option<T>} The flattened Option.
   */
  flatten<U>(this: Some<Option<U>>): Option<U> {
    return this.value;
  }

  /**
   * Calls the provided function with the contained value and returns self.
   * @param {(value: T) => void} fn The function to call with the contained value.
   * @returns {this} The Same Some instance.
   */
  inspect(fn: (value: T) => void): this {
    fn(this.value);
    return this;
  }

  /**
   * Returns the option if it contains a value, otherwise returns other.
   * @param {Option<T>} _other The alternative Option (unused in Some).
   * @returns {Option<T>} This Some instance.
   */
  or(_other: Option<T>): Option<T> {
    return this;
  }

  /**
   * Converts a Some<T> to an Ok<T>
   * @template T The type of the _defaultValue.
   * @param {NonNullable<T>} _defaultValue The alternative value (unused in Some).
   * @returns {Result<T, never>} The Result containing the defaultValue.
   */
  okOr(_defaultValue: NonNullable<T>): Result<T, never> {
    return Result.ok(this.value);
  }
}

/**
 * Represents the absence of a value.
 */
class None {
  readonly _tag = "None" as const;

  constructor() { }

  /**
   * Checks if the Option is a Some value.
   * @returns {boolean} Always false for None.
   */
  isSome(): boolean {
    return false;
  }

  /**
   * Checks if the Option is a None value.
   * @returns {boolean} Always true for None.
   */
  isNone(): boolean {
    return true;
  }

  /**
   * Checks if the Option is Some and the value satisfies a predicate.
   * @param {(value: never) => boolean} _pred The predicate function (unused in None).
   * @returns {boolean} Always false for None.
   */
  isSomeAnd(_pred: (value: never) => boolean): boolean {
    return false;
  }

  /**
   * Throws an error when trying to unwrap a None value.
   * @throws {OptionUnwrapError} Always throws for None.
   */
  unwrap(): never {
    throw new OptionUnwrapError("Called `unwrap` on a `None` value");
  }

  /**
   * Returns the provided default value.
   * @template T The type of the default value.
   * @param {T} defaultValue The default value to return.
   * @returns {T} The provided default value.
   */
  unwrapOr<T>(defaultValue: T): T {
    return defaultValue;
  }

  /**
   * Returns the result of calling the provided function.
   * @template T The type of the computed value.
   * @param {() => T} fn The function to compute the value.
   * @returns {T} The result of calling fn.
   */
  unwrapOrElse<T>(fn: () => T): T {
    return fn();
  }

  /**
   * Returns None if the option is None, otherwise returns other.
   * @template T The type of the other Option.
   * @param {Option<T>} _other The other Option (unused in None).
   * @returns {None} This None instance.
   */
  and<T>(_other: Option<T>): None {
    return this;
  }

  /**
   * Returns None if the option is None, otherwise calls fn with the wrapped value and returns the result.
   * @template T The type of the Option that would be returned if this was Some.
   * @param {(value: never) => Option<T>} _fn The function to apply (unused in None).
   * @returns {None} This None instance.
   */
  andThen<T>(_fn: (value: never) => Option<T>): None {
    return this;
  }

  /**
   * Maps a Some value to a new Some value by applying a function to the contained value.
   * @template T The type that would result from mapping if this was Some.
   * @param {(value: never) => T} _fn The function to apply (unused in None).
   * @returns {None} This None instance.
   */
  map<T>(_fn: (value: never) => T): None {
    return this;
  }

  /**
   * Applies a function to the contained value (if Some), or computes a default (if None).
   * @template U The type of the result.
   * @param {() => U} onNone The function to compute a default value.
   * @param {(value: never) => U} _onSome The function to apply to a value (unused in None).
   * @returns {U} The result of calling onNone.
   */
  mapOrElse<U>(onNone: () => U, _onSome: (value: never) => U): U {
    return onNone();
  }

  /**
   * Returns None if the option is None, otherwise calls pred with the wrapped value and returns:
   * - Some(t) if pred returns true (where t is the wrapped value)
   * - None if pred returns false
   * @param {(value: never) => boolean} _pred The predicate function (unused in None).
   * @returns {None} This None instance.
   */
  filter(_pred: (value: never) => boolean): None {
    return this;
  }

  /**
   * Converts from Option<Option<T>> to Option<T>.
   * @returns {None} This None instance.
   */
  flatten(): None {
    return this;
  }

  /**
   * Calls the provided function with the contained value and returns self.
   * @param {(value: never) => void} _fn The function to call (unused in None).
   * @returns {this} This None instance.
   */
  inspect(_fn: (value: never) => void): this {
    return this;
  }

  /**
   * Returns the option if it contains a value, otherwise returns other.
   * @template T The type of the other Option.
   * @param {Option<T>} other The alternative Option to return.
   * @returns {Option<T>} The other Option.
   */
  or<T>(other: Option<T>): Option<T> {
    return other;
  }

  /**
   * Converts a None to an Err<E>
   * @template E The type of the defaultValue.
   * @param {NonNullable<F>} defaultValue The alternative error.
   * @returns {Result<U, F>} The Result containing the defaultValue.
   */
  okOr<U, F>(defaultValue: NonNullable<F>): Result<U, F> {
    return Result.err(defaultValue);
  }
}

/**
 * Error thrown when attempting to unwrap a None value.
 */
export class OptionUnwrapError extends TaggedError {
  readonly _tag = "OptionUnwrapError" as const;
}
