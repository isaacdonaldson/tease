"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipeArgumentError = void 0;
exports.pipe = pipe;
exports.syncPipe = syncPipe;
const error_js_1 = require("./error.js");
const utils_js_1 = require("./utils.js");
const result_js_1 = require("./result.js");
/**
 * Error thrown when a non-function is provided
 */
class PipeArgumentError extends error_js_1.TaggedError {
    constructor() {
        super(...arguments);
        this._tag = "PipeArgumentError";
    }
}
exports.PipeArgumentError = PipeArgumentError;
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
async function pipe(startVal, ...fns) {
    const pipeRes = await result_js_1.Result.asyncTry(async () => {
        let pipeCarry = startVal;
        for (const fn of fns) {
            if (typeof fn !== "function") {
                throw new PipeArgumentError("All arguments must be functions");
            }
            let res;
            const fnResult = fn(pipeCarry);
            if ((0, utils_js_1.isPromise)(fnResult)) {
                res = await result_js_1.Result.asyncTry(async () => await fnResult);
            }
            else {
                res = result_js_1.Result.ok(fnResult);
            }
            if (res.isErr()) {
                return res;
            }
            else if (result_js_1.Result.isResult(res.unwrap())) {
                const val = res.unwrap();
                if (val.isErr()) {
                    return val;
                }
                else {
                    pipeCarry = val.unwrap();
                }
            }
            else {
                pipeCarry = res.unwrap();
            }
        }
        return pipeCarry;
    });
    if (pipeRes.isOk()) {
        const val = pipeRes.unwrap();
        if (result_js_1.Result.isResult(val)) {
            const resVal = val;
            if (resVal.isErr()) {
                return val;
            }
            else {
                return result_js_1.Result.ok(resVal.unwrap());
            }
        }
        else {
            return pipeRes;
        }
    }
    else {
        return pipeRes;
    }
}
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
function syncPipe(startVal, ...fns) {
    const pipeRes = result_js_1.Result.try(() => {
        let pipeCarry = startVal;
        for (const fn of fns) {
            if (typeof fn !== "function") {
                throw new PipeArgumentError("All arguments must be functions");
            }
            const res = result_js_1.Result.try(() => fn(pipeCarry));
            if (res.isErr()) {
                return res;
            }
            else if (result_js_1.Result.isResult(res.unwrap())) {
                const val = res.unwrap();
                if (val.isErr()) {
                    return val;
                }
                else {
                    pipeCarry = val.unwrap();
                }
            }
            else {
                pipeCarry = res.unwrap();
            }
        }
        return pipeCarry;
    });
    if (pipeRes.isOk()) {
        const val = pipeRes.unwrap();
        if (result_js_1.Result.isResult(val)) {
            const resVal = val;
            if (resVal.isErr()) {
                return val;
            }
            else {
                return result_js_1.Result.ok(resVal.unwrap());
            }
        }
        else {
            return pipeRes;
        }
    }
    else {
        return pipeRes;
    }
}
