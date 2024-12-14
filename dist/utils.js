export function isNullable(value) {
    return value === null || value === undefined;
}
export function isNonNullable(value) {
    return !isNullable(value);
}
export function isPromise(value) {
    return value instanceof Promise;
}
