"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAsyncDefer = withAsyncDefer;
exports.withDefer = withDefer;
const result_js_1 = require("./result.js");
/**
 * Executes an asynchronous function with deferred callbacks and error handling.
 * @template T The return type of the main function.
 * @template E The error type for errdefer callbacks.
 * @param {function} fn The main function to execute, which takes defer and errdefer functions as arguments.
 * @returns {Promise<Result<T, E>>} The result of the main function wrapped in a Result type.
 *
 * @description
 * This function provides a mechanism for executing a given asynchronous function with deferred callbacks.
 * It allows for both normal deferred callbacks (executed after the main function, regardless of success or failure)
 * and error-specific deferred callbacks (executed only if an error occurs).
 *
 * The main function is passed two callback registration functions:
 * - `defer`: Register callbacks to be executed after the main function, regardless of its outcome.
 * - `errdefer`: Register callbacks to be executed only if the main function throws an error.
 *
 * If the main function executes successfully, the result is wrapped in a `Result.ok`.
 * If an error occurs, all registered errdefer callbacks are executed, and the error is wrapped in a `Result.err`.
 * Finally, all registered defer callbacks are executed, regardless of the outcome.
 *
 * @example
 * const result = await withAsyncDefer(async (defer, errdefer) => {
 *   defer(async () => console.log("This always runs"));
 *   errdefer(async (err) => console.error("Error occurred:", err));
 *   // Main function logic here
 *   return "Success";
 * });
 */
function withAsyncDefer(fn) {
    return __awaiter(this, void 0, void 0, function* () {
        const deferredCallbacks = [];
        const defer = (deferCallback) => {
            deferredCallbacks.unshift(deferCallback);
        };
        const errdeferredCallbacks = [];
        const errdefer = (errdeferCallback) => {
            errdeferredCallbacks.unshift(errdeferCallback);
        };
        try {
            const result = yield fn(defer, errdefer);
            return result_js_1.Result.ok(result);
        }
        catch (err) {
            errdeferredCallbacks.forEach((callback) => __awaiter(this, void 0, void 0, function* () {
                if (callback.constructor.name === "AsyncFunction") {
                    yield callback(err);
                }
                else {
                    callback(err);
                }
            }));
            return result_js_1.Result.err(err);
        }
        finally {
            deferredCallbacks.forEach((callback) => __awaiter(this, void 0, void 0, function* () {
                if (callback.constructor.name === "AsyncFunction") {
                    yield callback();
                }
                else {
                    callback();
                }
            }));
        }
    });
}
/**
 * Executes a function with deferred callbacks and error handling.
 * @template T The return type of the main function.
 * @template E The error type for errdefer callbacks.
 * @param {function} fn The main function to execute, which takes defer and errdefer functions as arguments.
 * @returns {Result<T, E>} The result of the main function wrapped in a Result type.
 *
 * @description
 * This function provides a mechanism for executing a given function with deferred callbacks.
 * It allows for both normal deferred callbacks (executed after the main function, regardless of success or failure)
 * and error-specific deferred callbacks (executed only if an error occurs).
 *
 * The main function is passed two callback registration functions:
 * - `defer`: Register callbacks to be executed after the main function, regardless of its outcome.
 * - `errdefer`: Register callbacks to be executed only if the main function throws an error.
 *
 * If the main function executes successfully, the result is wrapped in a `Result.ok`.
 * If an error occurs, all registered errdefer callbacks are executed, and the error is wrapped in a `Result.err`.
 * Finally, all registered defer callbacks are executed, regardless of the outcome.
 *
 * @example
 * const result = withDefer((defer, errdefer) => {
 *   defer(() => console.log("This always runs"));
 *   errdefer((err) => console.error("Error occurred:", err));
 *   // Main function logic here
 *   return "Success";
 * });
 */
function withDefer(fn) {
    const deferredCallbacks = [];
    const defer = (deferCallback) => {
        deferredCallbacks.unshift(deferCallback);
    };
    const errdeferredCallbacks = [];
    const errdefer = (errdeferCallback) => {
        errdeferredCallbacks.unshift(errdeferCallback);
    };
    try {
        return result_js_1.Result.ok(fn(defer, errdefer));
    }
    catch (err) {
        errdeferredCallbacks.forEach((callback) => callback(err));
        return result_js_1.Result.err(err);
    }
    finally {
        deferredCallbacks.forEach((callback) => callback());
    }
}
