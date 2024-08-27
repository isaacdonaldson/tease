import { Result } from "./result";

type DeferCallback = () => void;
type DeferFn = (callback: DeferCallback) => void;

type ErrdeferCallback<E> = (err: E) => void;
type ErrdeferFn<E> = (callback: ErrdeferCallback<E>) => void;

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
export function withDefer<T, E>(fn: (defer: DeferFn, errdefer: ErrdeferFn<E>) => T): Result<T, E> {
  const deferredCallbacks: DeferCallback[] = [];
  const defer = (deferCallback: DeferCallback) => {
    deferredCallbacks.unshift(deferCallback);
  };
  const errdeferredCallbacks: ErrdeferCallback<E>[] = [];
  const errdefer = (errdeferCallback: ErrdeferCallback<E>) => {
    errdeferredCallbacks.unshift(errdeferCallback);
  };

  // TODO: Make a version for async functions? (try writing async functions)
  try {
    return Result.ok(fn(defer, errdefer));
  } catch (err: unknown) {
    errdeferredCallbacks.forEach((callback) => callback(err as E));
    return Result.err(err as E);
  } finally {
    deferredCallbacks.forEach((callback) => callback());
  }
}
