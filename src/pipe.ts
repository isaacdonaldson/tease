import { TaggedError } from "./error";
import { Result } from "./result";

/**
 * Executes a series of functions in a pipeline, passing the result of each function to the next.
 *
 * @param {unknown} startVal - The start value to be given to the pipe sequence.
 * @param {...Function} fns - The functions to be executed in sequence.
 * @returns {Result<unknown, Error>} A Result object containing either the final result or an error.
 *
 * @throws {PipeArgumentError} If any of the provided arguments is not a function.
 *
 * @description
 * This function takes a starting value, and any number of functions as arguments and executes them in sequence.
 * The result of each function is passed as an argument to the next function in the pipeline.
 * If any function in the pipeline returns an error (wrapped in a Result), the pipeline stops
 * and returns that error. Otherwise, it continues until all functions have been executed.
 *
 * The function uses the Result type to handle errors and successful executions.
 *
 * @example
 * const result = pipe(
 *   5,
 *   (x) => x + 1,
 *   (x) => x * 2,
 *   (x) => Result.ok(x.toString())
 * );
 * // If successful, result will contain the final value as a string.
 * // If any step fails, result will contain the error.
 */
export function pipe(startVal: unknown, ...fns: unknown[]): Result<unknown, Error> {
  const pipeRes = Result.try(() => {
    let pipeCarry = startVal;

    for (const fn of fns) {
      if (typeof fn !== "function") {
        throw new PipeArgumentError("All arguments must be functions");
      }

      const res = Result.try(() => fn(pipeCarry));

      if (res.isErr()) {
        return res;
      } else if (Result.isResult(res.unwrap())) {
        const val = res.unwrap();
        if (val.isErr()) {
          return val;
        } else {
          pipeCarry = val.unwrap();
        }
      } else {
        pipeCarry = res.unwrap();
      }
    }

    return pipeCarry;
  });

  if (pipeRes.isOk()) {
    const val = pipeRes.unwrap();
    if (Result.isResult(val)) {
      return pipeRes.flatten();
    } else {
      return pipeRes;
    }
  } else {
    return pipeRes;
  }
}

/**
 * Error thrown when a non-function is provided
 */
export class PipeArgumentError extends TaggedError {
  readonly _tag = "PipeArgumentError" as const;
}
