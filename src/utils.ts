export function isNullable<T>(
  value: T | null | undefined,
): value is null | undefined {
  return value === null || value === undefined;
}

export function isNonNullable<T>(value: T): value is T {
  return !isNullable(value);
}

export function isPromise<T>(value: T | Promise<T>): value is Promise<T> {
  return value instanceof Promise;
}
