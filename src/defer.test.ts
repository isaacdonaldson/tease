import { withDefer, withAsyncDefer } from './defer';
import { Result } from './result';

describe('withDefer', () => {
  it('should execute the main function and return its result', () => {
    const result = withDefer(() => 42);
    expect(result).toEqual(Result.ok(42));
  });

  it('should execute deferred callbacks in LIFO order', () => {
    const order: number[] = [];
    withDefer((defer) => {
      defer(() => order.push(1));
      defer(() => order.push(2));
      defer(() => order.push(3));
    });
    expect(order).toEqual([3, 2, 1]);
  });

  it('should execute deferred callbacks even if the main function throws', () => {
    let order = 0
    let deferredFn = () => order = 42
    expect(() =>
      withDefer((defer) => {
        defer(deferredFn);
        throw new Error('Test error');
      })
    ).not.toThrow();
    expect(order).toEqual(42);
  });


  it('should not execute deferred callbacks after the main function throws', () => {
    let callResult = 0
    let deferredFn = () => callResult = 42
    expect(() =>
      withDefer((defer) => {
        throw new Error('Test error');
        defer(deferredFn);
      })
    ).not.toThrow();
    expect(callResult).toEqual(0);
  });

  it('should return an error result if the main function throws', () => {
    const error = new Error('Test error');
    const result = withDefer(() => {
      throw error;
    });
    expect(result).toEqual(Result.err(error));
  });

  it('should execute errdefer callbacks if the main function throws', () => {
    let callResult: Error = new Error('THIS SHOULD NOT BE SET');
    let errdeferFn = (errAA: Error) => callResult = errAA
    const error = new Error('Test error');
    withDefer<unknown, Error>((_defer, errdefer) => {
      errdefer(errdeferFn);
      throw error;
    });
    expect(callResult).toEqual(error);
  });

  it('should not execute errdefer callbacks if the main function succeeds', () => {
    const error = new Error('Test error');
    let callResult: Error = error
    let errdeferFn = (errAA: Error) => callResult = errAA

    withDefer<number, Error>((_defer, errdefer) => {
      errdefer(errdeferFn);
      return 42;
    });
    expect(callResult).toEqual(error);
  });

  it('should handle multiple defer and errdefer callbacks', () => {
    let errors: unknown[] = [];
    let order: number[] = [];
    const deferFn1 = () => order.push(1)
    const deferFn2 = () => order.push(2)
    const errdeferFn1 = (err: unknown) => errors.push(err)
    const errdeferFn2 = (err: unknown) => errors.push(err)

    withDefer((defer, errdefer) => {
      defer(deferFn1);
      defer(deferFn2);
      errdefer(errdeferFn1);
      errdefer(errdeferFn2);
      return 42;
    });

    expect(order).toEqual([2, 1]);
    expect(errors).toEqual([]);
  });

  it('should handle nested withDefer calls', () => {
    let order: string[] = [];
    const outerDefer = () => order.push("outer");
    const innerDefer = () => order.push("inner");

    const result = withDefer((defer1) => {
      defer1(outerDefer);
      return withDefer((defer2) => {
        defer2(innerDefer);
        return 42;
      });
    });

    expect(result).toEqual(Result.ok(Result.ok(42)));
    expect(order).toEqual(["inner", "outer"]);
  });

  it('should provide type safety for error handling', () => {
    interface CustomError {
      message: string;
      code: number;
    }

    let testNumber = 0

    const result = withDefer<number, CustomError>((defer, errdefer) => {
      // Defer is run no matter what
      defer(() => {
        testNumber = 42
      })

      errdefer((err) => {
        // TypeScript should recognize 'err' as CustomError
        testNumber = err.code
      });
      throw { message: 'Custom error', code: 500 };
    });

    expect(result).toEqual(Result.err({ message: 'Custom error', code: 500 }));
    expect(testNumber).toEqual(42);
  });
});

describe('withAsyncDefer', () => {
  it('should execute the main function and return its result', async () => {
    const result = await withAsyncDefer(async () => 42);
    expect(result).toEqual(Result.ok(42));
  });

  it('should execute deferred callbacks in LIFO order', async () => {
    const order: number[] = [];
    await withAsyncDefer(async (defer) => {
      defer(async () => { order.push(1) });
      defer(async () => { order.push(2) });
      defer(async () => { order.push(3) });
    });
    expect(order).toEqual([3, 2, 1]);
  });

  it('should execute deferred callbacks even if the main function throws', async () => {
    let order = 0;
    let deferredFn = async () => { order = 42 };
    await expect(
      withAsyncDefer(async (defer) => {
        defer(deferredFn);
        throw new Error('Test error');
      })
    ).resolves.not.toThrow();
    expect(order).toEqual(42);
  });

  it('should not execute deferred callbacks after the main function throws', async () => {
    let callResult = 0;
    let deferredFn = async () => { callResult = 42 };
    await expect(
      withAsyncDefer(async (defer) => {
        throw new Error('Test error');
        defer(deferredFn);
      })
    ).resolves.not.toThrow();
    expect(callResult).toEqual(0);
  });

  it('should return an error result if the main function throws', async () => {
    const error = new Error('Test error');
    const result = await withAsyncDefer(async () => {
      throw error;
    });
    expect(result).toEqual(Result.err(error));
  });

  it('should execute errdefer callbacks if the main function throws', async () => {
    let callResult: Error = new Error('THIS SHOULD NOT BE SET');
    let errdeferFn = async (errAA: Error) => { callResult = errAA };
    const error = new Error('Test error');
    await withAsyncDefer<unknown, Error>(async (_defer, errdefer) => {
      errdefer(errdeferFn);
      throw error;
    });
    expect(callResult).toEqual(error);
  });

  it('should not execute errdefer callbacks if the main function succeeds', async () => {
    const error = new Error('THIS SHOULD NOT BE SET');
    let callResult: Error = error;
    let errdeferFn = async (errAA: Error) => { callResult = errAA };

    const result = await withAsyncDefer<number, Error>(async (_defer, errdefer) => {
      errdefer(errdeferFn);
      return 42;
    });
    expect(result).toEqual(Result.ok(42));
    expect(callResult).toEqual(error);
  });

  it('should handle multiple defer and errdefer callbacks', async () => {
    let errors: unknown[] = [];
    let order: number[] = [];
    const deferFn1 = async () => { order.push(1) };
    const deferFn2 = async () => { order.push(2) };
    const errdeferFn1 = async (err: unknown) => { errors.push(err) };
    const errdeferFn2 = async (err: unknown) => { errors.push(err) };

    await withAsyncDefer(async (defer, errdefer) => {
      defer(deferFn1);
      defer(deferFn2);
      errdefer(errdeferFn1);
      errdefer(errdeferFn2);
      return 42;
    });

    expect(order).toEqual([2, 1]);
    expect(errors).toEqual([]);
  });

  it('should handle nested withAsyncDefer calls', async () => {
    let order: string[] = [];
    const outerDefer = async () => { order.push("outer") };
    const innerDefer = async () => { order.push("inner") };

    const result = await withAsyncDefer(async (defer1) => {
      defer1(outerDefer);
      return await withAsyncDefer(async (defer2) => {
        defer2(innerDefer);
        return 42;
      });
    });

    expect(result).toEqual(Result.ok(Result.ok(42)));
    expect(order).toEqual(["inner", "outer"]);
  });

  it('should provide type safety for error handling', async () => {
    interface CustomError {
      message: string;
      code: number;
    }

    let testNumber = 0;

    const result = await withAsyncDefer<number, CustomError>(async (defer, errdefer) => {
      // Defer is run no matter what
      defer(async () => {
        testNumber = 42;
      });

      errdefer(async (err) => {
        // TypeScript should recognize 'err' as CustomError
        testNumber = err.code;
      });
      throw { message: 'Custom error', code: 500 };
    });

    expect(result).toEqual(Result.err({ message: 'Custom error', code: 500 }));
    expect(testNumber).toEqual(42);
  });
});
