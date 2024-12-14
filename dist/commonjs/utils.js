"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNullable = isNullable;
exports.isNonNullable = isNonNullable;
exports.isPromise = isPromise;
function isNullable(value) {
    return value === null || value === undefined;
}
function isNonNullable(value) {
    return !isNullable(value);
}
function isPromise(value) {
    return value instanceof Promise;
}
