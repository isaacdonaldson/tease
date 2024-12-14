import { TaggedError } from "./error.js";
import { Result } from "./result.js";
/**
 * Error thrown when a non-function is provided
 */
export declare class PipeArgumentError extends TaggedError {
    readonly _tag: "PipeArgumentError";
}
type AsyncFunction<T, U> = (arg: T) => Promise<U>;
type SyncFunction<T, U> = (arg: T) => U;
type PipeFunction<T, U> = AsyncFunction<T, U> | SyncFunction<T, U>;
type InferReturn<T> = T extends (...args: any[]) => infer R ? R : never;
type Awaited<T> = T extends Promise<infer U> ? U : T;
type NextInput<T> = T extends Result<infer U, any> ? U : T;
type PipeChain<Fns extends any[], Acc = unknown> = Fns extends [infer First, ...infer Rest] ? First extends PipeFunction<NextInput<Acc>, any> ? PipeChain<Rest, Awaited<InferReturn<First>>> : never : Acc;
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
export declare function pipe<Fns extends PipeFunction<any, any>[]>(startVal: unknown, ...fns: Fns): Promise<Result<PipeChain<Fns>, Error>>;
type SyncPipeChain<Fns extends any[], Acc = unknown> = Fns extends [infer First, ...infer Rest] ? First extends SyncFunction<NextInput<Acc>, any> ? SyncPipeChain<Rest, InferReturn<First>> : never : Acc;
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
export declare function syncPipe<Fns extends SyncFunction<any, any>[]>(startVal: unknown, ...fns: Fns): Result<SyncPipeChain<Fns>, Error>;
export {};
//# sourceMappingURL=pipe.d.ts.map