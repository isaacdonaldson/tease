import { TaggedError } from "./error";

// Helper functions
export function ok<T>(value: T): Ok<T> {
  return new Ok(value);
}

export function err<E>(error: E): Err<E> {
  return new Err(error);
}

export type Result<T, E> = Ok<T> | Err<E>;

class Ok<T> {
  readonly _tag = "Ok" as const;

  constructor(private readonly value: T) {}

  isOk(): this is Ok<T> {
    return true;
  }

  isErr(): this is Err<never> {
    return false;
  }

  unwrap(): T {
    return this.value;
  }

  unwrapOr(_defaultValue: T): T {
    return this.value;
  }

  unwrapErr(): never {
    throw new UnwrapError("Called `unwrapErr` on an `Ok` value");
  }

  unwrapOrElse(_fn: (err: never) => T): T {
    return this.value;
  }

  and<U, F>(other: Result<U, F>): Result<U, F> {
    return other;
  }

  andThen<U, F>(fn: (value: T) => Result<U, F>): Result<U, F> {
    return fn(this.value);
  }

  map<U>(fn: (value: T) => U): Result<U, never> {
    return new Ok(fn(this.value));
  }

  mapErr<F>(_fn: (error: never) => F): Result<T, F> {
    return this as unknown as Result<T, F>;
  }

  flatten<U>(this: Ok<Result<U, never>>): Result<U, never> {
    return this.value;
  }

  inspect(fn: (value: T) => void): this {
    fn(this.value);
    return this;
  }

  inspectErr(_fn: (error: never) => void): this {
    return this;
  }
}

class Err<E> {
  readonly _tag = "Err" as const;

  constructor(private readonly error: E) {}

  isOk(): this is Ok<never> {
    return false;
  }

  isErr(): this is Err<E> {
    return true;
  }

  unwrap(): never {
    throw new UnwrapError("Called `unwrap` on an `Err` value");
  }

  unwrapOr<T>(defaultValue: T): T {
    return defaultValue;
  }

  unwrapErr(): E {
    return this.error;
  }

  unwrapOrElse<T>(fn: (err: E) => T): T {
    return fn(this.error);
  }

  and<U, F>(_other: Result<U, F>): Result<U, F> {
    return this as unknown as Result<U, F>;
  }

  andThen<U, F>(_fn: (value: never) => Result<U, F>): Result<U, F> {
    return this as unknown as Result<U, F>;
  }

  map<U>(_fn: (value: never) => U): Result<U, E> {
    return this as unknown as Result<U, E>;
  }

  mapErr<F>(fn: (error: E) => F): Result<never, F> {
    return new Err(fn(this.error));
  }

  flatten<U>(): Result<U, E> {
    return this as unknown as Result<U, E>;
  }

  inspect(_fn: (value: never) => void): this {
    return this;
  }

  inspectErr(fn: (error: E) => void): this {
    fn(this.error);
    return this;
  }
}

// Errors
export class UnwrapError extends TaggedError {
  readonly _tag = "UnwrapError" as const;
}
