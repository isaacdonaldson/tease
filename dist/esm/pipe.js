var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { TaggedError } from "./error.js";
import { isPromise } from "./utils.js";
import { Result } from "./result.js";
/**
 * Error thrown when a non-function is provided
 */
export class PipeArgumentError extends TaggedError {
    constructor() {
        super(...arguments);
        this._tag = "PipeArgumentError";
    }
}
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
export function pipe(startVal, ...fns) {
    return __awaiter(this, void 0, void 0, function* () {
        const pipeRes = yield Result.asyncTry(() => __awaiter(this, void 0, void 0, function* () {
            let pipeCarry = startVal;
            for (const fn of fns) {
                if (typeof fn !== "function") {
                    throw new PipeArgumentError("All arguments must be functions");
                }
                let res;
                const fnResult = fn(pipeCarry);
                if (isPromise(fnResult)) {
                    res = yield Result.asyncTry(() => __awaiter(this, void 0, void 0, function* () { return yield fnResult; }));
                }
                else {
                    res = Result.ok(fnResult);
                }
                if (res.isErr()) {
                    return res;
                }
                else if (Result.isResult(res.unwrap())) {
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
        }));
        if (pipeRes.isOk()) {
            const val = pipeRes.unwrap();
            if (Result.isResult(val)) {
                const resVal = val;
                if (resVal.isErr()) {
                    return val;
                }
                else {
                    return Result.ok(resVal.unwrap());
                }
            }
            else {
                return pipeRes;
            }
        }
        else {
            return pipeRes;
        }
    });
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
export function syncPipe(startVal, ...fns) {
    const pipeRes = Result.try(() => {
        let pipeCarry = startVal;
        for (const fn of fns) {
            if (typeof fn !== "function") {
                throw new PipeArgumentError("All arguments must be functions");
            }
            const res = Result.try(() => fn(pipeCarry));
            if (res.isErr()) {
                return res;
            }
            else if (Result.isResult(res.unwrap())) {
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
        if (Result.isResult(val)) {
            const resVal = val;
            if (resVal.isErr()) {
                return val;
            }
            else {
                return Result.ok(resVal.unwrap());
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
