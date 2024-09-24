import { syncPipe, pipe } from "./pipe";
import { Result } from "./result";

describe("pipe function", () => {
  it("should execute a single function correctly", () => {
    const result = syncPipe(10, (x: number) => x + 1);
    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBe(11);
  });

  it("should execute multiple functions in sequence", () => {
    const result = syncPipe(
      1,
      (x: number) => x + 1,
      (x: number) => x * 2,
    );
    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBe(4);
  });

  it("should stop execution and return error if a function returns Result.err", () => {
    const error = new Error("Test error");
    const result = syncPipe(
      1,
      () => Result.err(error),
      () => 3,
    );

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBe(error);
  });

  it("should throw PipeArgumentError if a non-function argument is provided", () => {
    const result = syncPipe(1, "not a function" as any, () => 3);
    expect(result.isErr()).toBe(true);
    const err = result.unwrapErr();
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("All arguments must be functions");
  });

  it("should handle an empty list of functions", () => {
    const result = syncPipe(1);
    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBe(1);
  });

  it("should pass the result of each function to the next", () => {
    const result = syncPipe(
      "Hello",
      (x: string) => `${x}, World`,
      (x: string) => x.length,
    );
    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBe(12);
  });

  it("should handle errors thrown within functions", () => {
    const result = syncPipe(
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
    const result = syncPipe(
      [1, 2],
      ([a, b]: number[]) => a + b,
      (sum: number) => sum * 2,
    );
    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBe(6);
  });
});

describe("pipe function", () => {
  it("should execute a single async function correctly", async () => {
    const result = await pipe(10, async (x: number) => x + 1);
    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBe(11);
  });

  it("should execute multiple async functions in sequence", async () => {
    const result = await pipe(
      1,
      async (x: number) => x + 1,
      async (x: number) => x * 2,
    );
    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBe(4);
  });

  it("should handle a mix of sync and async functions", async () => {
    const result = await pipe(
      1,
      async (x: number) => x + 1,
      (x: number) => x * 2,
      async (x: number) => x - 1,
    );
    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBe(3);
  });

  it("should stop execution and return error if an async function returns Result.err", async () => {
    const error = new Error("Test error");
    const result = await pipe(
      1,
      async () => Result.err(error),
      async () => 3,
    );

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBe(error);
  });

  it("should throw PipeArgumentError if a non-function argument is provided", async () => {
    const result = await pipe(1, "not a function" as any, async () => 3);
    expect(result.isErr()).toBe(true);
    const err = result.unwrapErr();
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("All arguments must be functions");
  });

  it("should handle an empty list of functions", async () => {
    const result = await pipe(1);
    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBe(1);
  });

  it("should pass the result of each async function to the next", async () => {
    const result = await pipe(
      "Hello",
      async (x: string) => `${x}, World`,
      async (x: string) => x.length,
    );
    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBe(12);
  });

  it("should handle errors thrown within async functions", async () => {
    const result = await pipe(
      1,
      async () => {
        throw new Error("Test error");
      },
      async () => 3,
    );
    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(Error);
    expect(result.unwrapErr().message).toBe("Test error");
  });

  it("should handle async functions with multiple arguments correctly", async () => {
    const result = await pipe(
      [1, 2],
      async ([a, b]: number[]) => a + b,
      async (sum: number) => sum * 2,
    );
    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBe(6);
  });
});
