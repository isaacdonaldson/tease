import { pipe } from "./pipe";
import { Result } from "./result";

describe("pipe function", () => {
  it("should execute a single function correctly", () => {
    const result = pipe(10, (x: number) => x + 1);
    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBe(11);
  });

  it("should execute multiple functions in sequence", () => {
    const result = pipe(
      1,
      (x: number) => x + 1,
      (x: number) => x * 2,
    );
    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBe(4);
  });

  it("should stop execution and return error if a function returns Result.err", () => {
    const error = new Error("Test error");
    const result = pipe(
      1,
      () => Result.err(error),
      () => 3,
    );

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBe(error);
  });

  it("should throw PipeArgumentError if a non-function argument is provided", () => {
    const result = pipe(1, "not a function" as any, () => 3);
    expect(result.isErr()).toBe(true);
    const err = result.unwrapErr();
    console.log(err);
    expect(err).toBeInstanceOf(Error);
  });

  it("should handle an empty list of functions", () => {
    const result = pipe(1);
    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBe(1);
  });

  it("should pass the result of each function to the next", () => {
    const result = pipe(
      "Hello",
      (x: string) => `${x}, World`,
      (x: string) => x.length,
    );
    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBe(12);
  });

  it("should handle errors thrown within functions", () => {
    const result = pipe(
      1,
      () => {
        throw new Error("Test error");
      },
      () => 3,
    );
    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(Error);
    expect(result.unwrapErr().message).toBe("Test error");
  });

  it("should handle functions with multiple arguments correctly", () => {
    const result = pipe(
      [1, 2],
      ([a, b]: number[]) => a + b,
      (sum: number) => sum * 2,
    );
    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBe(6);
  });
});
