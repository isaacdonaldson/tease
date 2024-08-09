import { TaggedError } from "./error";

export function some<T>(value: NonNullable<T>): Some<T> {
  return new Some(value);
}

export function none(): None {
  return new None();
}

export type Option<T> = Some<T> | None;

class Some<T> {
  readonly _tag = "Some" as const;

  constructor(private readonly value: NonNullable<T>) {}

  isSome(): boolean {
    return true;
  }

  isNone(): boolean {
    return false;
  }

  isSomeAnd(pred: (value: T) => boolean): boolean {
    return pred(this.value);
  }

  unwrap(): T {
    return this.value;
  }

  unwrapOr(_defaultValue: T): T {
    return this.value;
  }

  unwrapOrElse(_fn: () => T): T {
    return this.value;
  }

  and<U>(other: Option<U>): Option<U> {
    return other;
  }

  andThen<U>(fn: (value: T) => Option<U>): Option<U> {
    return fn(this.value);
  }

  map<U>(fn: (value: T) => NonNullable<U>): Option<U> {
    return some(fn(this.value));
  }

  mapOrElse<U>(_onNone: () => U, onSome: (value: T) => U): U {
    return onSome(this.value);
  }

  filter(pred: (value: T) => boolean): Option<T> {
    return pred(this.value) ? this : none();
  }

  flatten(): Option<T> {
    if (this.value instanceof Some || this.value instanceof None)
      return this.value;
    throw new FlattenError("Called `flatten` on a non-option type");
  }

  inspect(fn: (value: T) => void): this {
    fn(this.value);
    return this;
  }

  or(_other: Option<T>): Option<T> {
    return this;
  }
}

class None {
  readonly _tag = "None" as const;

  constructor() {}

  isSome(): boolean {
    return false;
  }

  isNone(): boolean {
    return true;
  }

  isSomeAnd(_pred: (value: never) => boolean): boolean {
    return false;
  }

  unwrap(): never {
    throw new UnwrapError("Called `unwrap` on a `None` value");
  }

  unwrapOr<T>(defaultValue: T): T {
    return defaultValue;
  }

  unwrapOrElse<T>(fn: () => T): T {
    return fn();
  }

  and<T>(_other: Option<T>): None {
    return this;
  }

  andThen<T>(_fn: (value: never) => Option<T>): None {
    return this;
  }

  map<T>(_fn: (value: never) => T): None {
    return this;
  }

  mapOrElse<U>(onNone: () => U, _onSome: (value: never) => U): U {
    return onNone();
  }

  filter(_pred: (value: never) => boolean): None {
    return this;
  }

  flatten(): None {
    return this;
  }

  inspect(_fn: (value: never) => void): this {
    return this;
  }

  or<T>(other: Option<T>): Option<T> {
    return other;
  }
}

export class FlattenError extends TaggedError {
  readonly _tag = "FlattenError" as const;
}

export class UnwrapError extends TaggedError {
  readonly _tag = "UnwrapError" as const;
}
