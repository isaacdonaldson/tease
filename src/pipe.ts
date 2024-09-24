import { TaggedError } from "./error";
import { isPromise } from "./utils";
import { Result } from "./result";

/**
 * Error thrown when a non-function is provided
 */
export class PipeArgumentError extends TaggedError {
  readonly _tag = "PipeArgumentError" as const;
}

type AsyncFunction<T, U> = (arg: T) => Promise<U>;
type SyncFunction<T, U> = (arg: T) => U;
type PipeFunction<T, U> = AsyncFunction<T, U> | SyncFunction<T, U>;

// Helper type to infer the return type of a function
type InferReturn<T> = T extends (...args: any[]) => infer R ? R : never;

// Helper type to unwrap a Promise type
type Awaited<T> = T extends Promise<infer U> ? U : T;

// Helper type to get the input type of the next function in the pipe
type NextInput<T> = T extends Result<infer U, any> ? U : T;

// Recursive type to build the pipe chain
type PipeChain<Fns extends any[], Acc = unknown> = Fns extends [infer First, ...infer Rest]
  ? First extends PipeFunction<NextInput<Acc>, any>
    ? PipeChain<Rest, Awaited<InferReturn<First>>>
    : never
  : Acc;

/**
 * Executes a series of functions in a pipeline, where the output of each function
 * becomes the input of the next. This function supports both synchronous and
 * asynchronous operations.
 *
 * @template Fns - The array type of functions to be executed in the pipeline.
 * @param {unknown} startVal - The initial value to be passed to the first function in the pipeline.
 * @param {...Fns} fns - The functions to be executed in sequence. Each function should take
 *                       the output of the previous function as its input.
 * @returns {Promise<Result<PipeChain<Fns>, Error>>} A Promise that resolves to a Result containing
 *                                                   either the final output of the pipeline or an Error.
 *
 * @throws {PipeArgumentError} If any of the provided arguments is not a function.
 *
 * @example
 * const result = await pipe(
 *   5,
 *   (x) => x * 2,
 *   async (x) => x + 1,
 *   (x) => Result.ok(x.toString())
 * );
 * // result will be Result.ok("11") if successful
 */
export async function pipe<Fns extends PipeFunction<any, any>[]>(
  startVal: unknown,
  ...fns: Fns
): Promise<Result<PipeChain<Fns>, Error>> {
  const pipeRes = await Result.asyncTry(async () => {
    let pipeCarry: any = startVal;
    for (const fn of fns) {
      if (typeof fn !== "function") {
        throw new PipeArgumentError("All arguments must be functions");
      }
      let res: Result<unknown, Error>;
      const fnResult = fn(pipeCarry);
      if (isPromise(fnResult)) {
        res = await Result.asyncTry(async () => await fnResult);
      } else {
        res = Result.ok(fnResult);
      }
      if (res.isErr()) {
        return res;
      } else if (Result.isResult(res.unwrap())) {
        const val = res.unwrap() as Result<unknown, Error>;
        if (val.isErr()) {
          return val;
        } else {
          pipeCarry = val.unwrap();
        }
      } else {
        pipeCarry = res.unwrap();
      }
    }
    return pipeCarry as PipeChain<Fns>;
  });

  if (pipeRes.isOk()) {
    const val = pipeRes.unwrap();
    if (Result.isResult(val)) {
      const resVal = val as Result<unknown, Error>;
      if (resVal.isErr()) {
        return val as Result<PipeChain<Fns>, Error>;
      } else {
        return Result.ok(resVal.unwrap() as PipeChain<Fns>);
      }
    } else {
      return pipeRes as Result<PipeChain<Fns>, Error>;
    }
  } else {
    return pipeRes as Result<PipeChain<Fns>, Error>;
  }
}

type SyncPipeChain<Fns extends any[], Acc = unknown> = Fns extends [infer First, ...infer Rest]
  ? First extends SyncFunction<NextInput<Acc>, any>
    ? SyncPipeChain<Rest, InferReturn<First>>
    : never
  : Acc;

/**
 * Executes a series of synchronous functions in a pipeline, where the output of each
 * function becomes the input of the next.
 *
 * @template Fns - The array type of synchronous functions to be executed in the pipeline.
 * @param {unknown} startVal - The initial value to be passed to the first function in the pipeline.
 * @param {...Fns} fns - The synchronous functions to be executed in sequence. Each function
 *                       should take the output of the previous function as its input.
 * @returns {Result<SyncPipeChain<Fns>, Error>} A Result containing either the final output
 *                                              of the pipeline or an Error.
 *
 * @throws {PipeArgumentError} If any of the provided arguments is not a function.
 *
 * @example
 * const result = syncPipe(
 *   5,
 *   (x) => x * 2,
 *   (x) => x + 1,
 *   (x) => Result.ok(x.toString())
 * );
 * // result will be Result.ok("11") if successful
 */
export function syncPipe<Fns extends SyncFunction<any, any>[]>(
  startVal: unknown,
  ...fns: Fns
): Result<SyncPipeChain<Fns>, Error> {
  const pipeRes = Result.try(() => {
    let pipeCarry: any = startVal;
    for (const fn of fns) {
      if (typeof fn !== "function") {
        throw new PipeArgumentError("All arguments must be functions");
      }
      const res = Result.try(() => fn(pipeCarry));
      if (res.isErr()) {
        return res;
      } else if (Result.isResult(res.unwrap())) {
        const val = res.unwrap() as Result<unknown, Error>;
        if (val.isErr()) {
          return val;
        } else {
          pipeCarry = val.unwrap();
        }
      } else {
        pipeCarry = res.unwrap();
      }
    }
    return pipeCarry as SyncPipeChain<Fns>;
  });

  if (pipeRes.isOk()) {
    const val = pipeRes.unwrap();
    if (Result.isResult(val)) {
      const resVal = val as Result<unknown, Error>;
      if (resVal.isErr()) {
        return val as Result<SyncPipeChain<Fns>, Error>;
      } else {
        return Result.ok(resVal.unwrap() as SyncPipeChain<Fns>);
      }
    } else {
      return pipeRes as Result<SyncPipeChain<Fns>, Error>;
    }
  } else {
    return pipeRes as Result<SyncPipeChain<Fns>, Error>;
  }
}
