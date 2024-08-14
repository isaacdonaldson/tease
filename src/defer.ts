import { Result } from "./result";

type DeferCallback = () => void;
type DeferFn = (callback: DeferCallback) => void;

type ErrdeferCallback<E> = (err: E) => void;
type ErrdeferFn<E> = (callback: ErrdeferCallback<E>) => void;

/**
 * Executes a function with deferred callbacks.
 * @template T The return type of the main function.
 * @template E The error type for errdefer callbacks.
 * @param {function} fn The main function to execute.
 * @returns {Result<T, E>} The result of the main function wrapped in a Result type.
 */
export function withDefer<T, E>(
  fn: (
    defer: DeferFn,
    errdefer: ErrdeferFn<E>,
  ) => T
): Result<T, E> {
  const deferredCallbacks: (DeferCallback)[] = [];
  const defer = (deferCallback: DeferCallback) => {
    deferredCallbacks.unshift(deferCallback);
  };
  const errdeferredCallbacks: (ErrdeferCallback<E>)[] = [];
  const errdefer = (errdeferCallback: ErrdeferCallback<E>) => {
    errdeferredCallbacks.unshift(errdeferCallback);
  };

  // TODO: Make the order of the defer callbacks proper (LIFO)
  // TODO: Write test cases for the proper order of defer callbacks
  // TODO: Make a version for async functions? (try writing async functions)
  try {
    return Result.ok(fn(defer, errdefer));
  } catch (err: unknown) {
    errdeferredCallbacks.forEach(callback => callback(err as E));
    return Result.err(err as E);
  } finally {
    deferredCallbacks.forEach(callback => callback());
  }
}

// // Usage in a function
// function example() {
//   return withDefer((defer, errdefer) => {
//     console.log("Start of function");
//
//     defer(() => {
//       console.log("This will run at the end");
//     });
//
//     console.log("Middle of function");
//
//     // Some code that might throw an error
//     // ...
//
//     return "Function result";
//   });
// }
