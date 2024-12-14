import { Result } from "@/result";
import { Option } from "@/option";

describe("Result", () => {
  describe("ok function", () => {
    it("should create an Ok instance", () => {
      const result = Result.ok(42);
      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
    });
  });

  describe("err function", () => {
    it("should create an Err instance", () => {
      const result = Result.err("error");
      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
    });
  });

  describe("Ok", () => {
    const okResult: Result<number, string> = Result.ok(42);

    it("isOk should return true", () => {
      expect(okResult.isOk()).toBe(true);
    });

    it("isErr should return false", () => {
      expect(okResult.isErr()).toBe(false);
    });

    it("isOkAnd should return true for matching predicate", () => {
      expect(okResult.isOkAnd((value) => value > 40)).toBe(true);
    });

    it("isOkAnd should return false for non-matching predicate", () => {
      expect(okResult.isOkAnd((value) => value < 40)).toBe(false);
    });

    it("isErrAnd should always return false", () => {
      expect(okResult.isErrAnd(() => true)).toBe(false);
    });

    it("unwrap should return the value", () => {
      expect(okResult.unwrap()).toBe(42);
    });

    it("unwrapOr should return the value", () => {
      expect(okResult.unwrapOr(0)).toBe(42);
    });

    it("unwrapErr should throw UnwrapError", () => {
      expect(() => okResult.unwrapErr()).toThrow("Called `unwrapErr` on an `Ok` value");
    });

    it("unwrapOrElse should return the value", () => {
      expect(okResult.unwrapOrElse(() => 0)).toBe(42);
    });

    it("and should return the other result", () => {
      const other = Result.ok("test");
      expect(okResult.and(other)).toBe(other);
    });

    it("andThen should apply the function", () => {
      expect(okResult.andThen((value) => Result.ok(value * 2))).toEqual(Result.ok(84));
    });

    it("map should apply the function", () => {
      expect(okResult.map((value) => value * 2)).toEqual(Result.ok(84));
    });

    it("mapErr should return the original result", () => {
      expect(okResult.mapErr(() => "new error")).toBe(okResult);
    });

    it("mapOrElse should apply the ok function", () => {
      expect(
        okResult.mapOrElse(
          () => 0,
          (value) => value * 2,
        ),
      ).toBe(84);
    });

    it("flatten should return the inner result", () => {
      const nestedOk = Result.ok(Result.ok(42));
      expect(nestedOk.flatten()).toEqual(Result.ok(42));
    });

    it("inspect should call the function and return self", () => {
      const mockFn = jest.fn();
      const result = okResult.inspect(mockFn);
      expect(mockFn).toHaveBeenCalledWith(42);
      expect(result).toBe(okResult);
    });

    it("inspectErr should return self without calling the function", () => {
      const mockFn = jest.fn();
      const result = okResult.inspectErr(mockFn);
      expect(mockFn).not.toHaveBeenCalled();
      expect(result).toBe(okResult);
    });

    it("or should return the Ok value when called on Ok", () => {
      const result: Result<number, string> = Result.ok(42);
      const alternative: Result<number, string> = Result.ok(24);
      expect(result.or(alternative).unwrap()).toBe(42);
    });

    it("or should work with mixed Ok and Err types", () => {
      const okResult: Result<number, string> = Result.ok(42);
      const errResult: Result<number, string> = Result.err("error");

      expect(okResult.or(errResult).unwrap()).toBe(42);
      expect(errResult.or(okResult).unwrap()).toBe(42);
    });

    it("or should work with different Result types", () => {
      const strResult: Result<string, number> = Result.err(404);
      const numResult: Result<number, string> = Result.ok(42);

      const combined = strResult.or(numResult);
      expect(combined.unwrap()).toBe(42);

      // TypeScript should infer this as Result<string | number, never>
      expect(combined.isOk()).toBe(true);
    });

    it("err should return None", () => {
      const result: Result<number, string> = Result.ok(42);
      expect(result.err()).toStrictEqual(Option.none());
    });

    it("ok should return Some", () => {
      const result: Result<number, string> = Result.ok(42);
      expect(result.ok()).toStrictEqual(Option.some(42));
    });

    it("fromNullable should return Ok for non-null values", () => {
      expect(Result.fromNullable(42).unwrap()).toBe(42);
      expect(Result.fromNullable("hello").unwrap()).toBe("hello");
      expect(Result.fromNullable({ key: "value" }).unwrap()).toEqual({
        key: "value",
      });
    });

    it("fromNullable should return Ok for falsy non-null values", () => {
      expect(Result.fromNullable(0).unwrap()).toBe(0);
      expect(Result.fromNullable("").unwrap()).toBe("");
      expect(Result.fromNullable(false).unwrap()).toBe(false);
    });

    it("fromNullableWithError should return Ok for non-null values", () => {
      expect(Result.fromNullableWithError(42, "error").unwrap()).toBe(42);
      expect(Result.fromNullableWithError("hello", "error").unwrap()).toBe("hello");
      expect(Result.fromNullableWithError({ key: "value" }, "error").unwrap()).toEqual({ key: "value" });
    });

    it("fromNullableWithError should return Ok for falsy non-null values", () => {
      expect(Result.fromNullableWithError(0, "error").unwrap()).toBe(0);
      expect(Result.fromNullableWithError("", "error").unwrap()).toBe("");
      expect(Result.fromNullableWithError(false, "error").unwrap()).toBe(false);
    });

    it("try should return Ok for successful function execution", () => {
      const result = Result.try(() => 42);
      expect(result.isOk()).toBe(true);
      expect(result.unwrap()).toBe(42);
    });

    it("try should handle complex function executions", () => {
      const result = Result.try(() => {
        const obj = { key: "value" };
        return JSON.stringify(obj);
      });
      expect(result.isOk()).toBe(true);
      expect(result.unwrap()).toBe('{"key":"value"}');
    });

    it("asyncTry should return Ok for successful async function execution", async () => {
      const result = await Result.asyncTry(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 42;
      });
      expect(result.isOk()).toBe(true);
      expect(result.unwrap()).toBe(42);
    });

    it("asyncTry should handle complex async function executions", async () => {
      const result = await Result.asyncTry(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return new Promise((resolve) => resolve(42));
      });
      expect(result.isOk()).toBe(true);
      expect(result).toStrictEqual(Result.ok(42));
    });

    it("isResult should return true for Ok instances", () => {
      expect(Result.isResult(Result.ok(42))).toBe(true);
    });

    it("isResult should return true for Err instances", () => {
      expect(Result.isResult(Result.err("error"))).toBe(true);
    });
  });

  describe("Err", () => {
    const errResult: Result<number, string> = Result.err("error");

    it("isOk should return false", () => {
      expect(errResult.isOk()).toBe(false);
    });

    it("isErr should return true", () => {
      expect(errResult.isErr()).toBe(true);
    });

    it("isOkAnd should always return false", () => {
      expect(errResult.isOkAnd(() => true)).toBe(false);
    });

    it("isErrAnd should return true for matching predicate", () => {
      expect(errResult.isErrAnd((error) => error === "error")).toBe(true);
    });

    it("isErrAnd should return false for non-matching predicate", () => {
      expect(errResult.isErrAnd((error) => error === "other")).toBe(false);
    });

    it("unwrap should throw UnwrapError", () => {
      expect(() => errResult.unwrap()).toThrow("Called `unwrap` on an `Err` value");
    });

    it("unwrapOr should return the default value", () => {
      expect(errResult.unwrapOr(0)).toBe(0);
    });

    it("unwrapErr should return the error", () => {
      expect(errResult.unwrapErr()).toBe("error");
    });

    it("unwrapOrElse should return the result of the function", () => {
      expect(errResult.unwrapOrElse(() => 0)).toBe(0);
    });

    it("and should return the original error", () => {
      const other = Result.ok(42);
      expect(errResult.and(other)).toBe(errResult);
    });

    it("andThen should return the original error", () => {
      expect(errResult.andThen(() => Result.ok(42))).toBe(errResult);
    });

    it("map should return the original error", () => {
      expect(errResult.map((value) => value * 2)).toBe(errResult);
    });

    it("mapErr should apply the function", () => {
      expect(errResult.mapErr((error) => error.toUpperCase())).toEqual(Result.err("ERROR"));
    });

    it("mapOrElse should apply the err function", () => {
      expect(
        errResult.mapOrElse(
          (error) => error.length,
          () => 0,
        ),
      ).toBe(5);
    });

    it("flatten should return the original error", () => {
      expect(errResult.flatten()).toBe(errResult);
    });

    it("inspect should return self without calling the function", () => {
      const mockFn = jest.fn();
      const result = errResult.inspect(mockFn);
      expect(mockFn).not.toHaveBeenCalled();
      expect(result).toBe(errResult);
    });

    it("inspectErr should call the function and return self", () => {
      const mockFn = jest.fn();
      const result = errResult.inspectErr(mockFn);
      expect(mockFn).toHaveBeenCalledWith("error");
      expect(result).toBe(errResult);
    });

    it("or should return the alternative when called on Err", () => {
      const result: Result<number, string> = Result.err("error");
      const alternative: Result<number, string> = Result.ok(24);
      expect(result.or(alternative).unwrap()).toBe(24);
    });

    it("or should maintain the correct type when chaining", () => {
      const result: Result<number, string> = Result.err("first error");
      const chain = result.or(Result.err("second error")).or(Result.ok(42)).or(Result.ok(24));

      expect(chain.unwrap()).toBe(42);
    });

    it("err should return Some", () => {
      const result: Result<number, string> = Result.err("error");
      expect(result.err()).toStrictEqual(Option.some("error"));
    });

    it("ok should return None", () => {
      const result: Result<number, string> = Result.err("error");
      expect(result.ok()).toStrictEqual(Option.none());
    });

    it("fromNullable should return Err for null or undefined", () => {
      expect(Result.fromNullable(null).unwrapErr()).toBe("The value provided was Nullable");
      expect(Result.fromNullable(undefined).unwrapErr()).toBe("The value provided was Nullable");
    });

    it("fromNullableWith Error should return Err with provided error for null or undefined values", () => {
      expect(Result.fromNullableWithError(null, "Custom error").unwrapErr()).toBe("Custom error");
      expect(Result.fromNullableWithError(undefined, { code: 404 }).unwrapErr()).toEqual({ code: 404 });
    });

    it("fromNullableWithError should throw ResultNonNullableError when both value and error are null", () => {
      expect(() => Result.fromNullableWithError(null, null)).toThrow(
        "Both provided values are Nullable and a Result cannot be created",
      );
      expect(() => Result.fromNullableWithError(undefined, undefined)).toThrow(
        "Both provided values are Nullable and a Result cannot be created",
      );
    });

    it("fromNullableWithError should work with at least one being non-null", () => {
      expect(Result.fromNullableWithError(42, undefined).unwrap()).toBe(42);
      expect(Result.fromNullableWithError(undefined, "error").unwrapErr()).toBe("error");
    });

    it("try should return Err as Error for thrown errors", () => {
      const result = Result.try(() => {
        throw new Error("Test error");
      });
      expect(result.isErr()).toBe(true);
      const error = result.unwrapErr();
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Test error");
    });

    it("try should return Err as Error for null or undefined results", () => {
      const nullResult = Result.try(() => null);
      expect(nullResult.isErr()).toBe(true);
      expect(nullResult.unwrapErr()).toBeInstanceOf(Error);

      const undefinedResult = Result.try(() => undefined);
      expect(undefinedResult.isErr()).toBe(true);
      expect(undefinedResult.unwrapErr()).toBeInstanceOf(Error);
    });

    it("asyncTry should return Err as Error for thrown errors in async functions", async () => {
      const result = await Result.asyncTry(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw new Error("Async test error");
      });
      expect(result.isErr()).toBe(true);
      const error = result.unwrapErr();
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Async test error");
      expect(error).toBeInstanceOf(Error);
    });

    it("asyncTry should return Err as Error for null or undefined results in async functions", async () => {
      const nullResult = await Result.asyncTry(async () => null);
      expect(nullResult.isErr()).toBe(true);
      expect(nullResult.unwrapErr()).toBeInstanceOf(Error);

      const undefinedResult = await Result.asyncTry(async () => undefined);
      expect(undefinedResult.isErr()).toBe(true);
      expect(undefinedResult.unwrapErr()).toBeInstanceOf(Error);
    });

    it("isResult should return false for non-Result values", () => {
      expect(Result.isResult(42)).toBe(false);
      expect(Result.isResult("string")).toBe(false);
      expect(Result.isResult(null)).toBe(false);
      expect(Result.isResult(undefined)).toBe(false);
      expect(Result.isResult({})).toBe(false);
      expect(Result.isResult([])).toBe(false);
    });

    it("isResult should return false for objects with similar structure", () => {
      const fakeResult = { isOk: () => true, isErr: () => false };
      expect(Result.isResult(fakeResult)).toBe(false);
    });
  });
});
