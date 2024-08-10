import { ok, err, Result } from './result';

describe('Result', () => {
  describe('ok function', () => {
    it('should create an Ok instance', () => {
      const result = ok(42);
      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
    });
  });

  describe('err function', () => {
    it('should create an Err instance', () => {
      const result = err('error');
      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('Ok', () => {
    const okResult: Result<number, string> = ok(42);

    it('isOk should return true', () => {
      expect(okResult.isOk()).toBe(true);
    });

    it('isErr should return false', () => {
      expect(okResult.isErr()).toBe(false);
    });

    it('isOkAnd should return true for matching predicate', () => {
      expect(okResult.isOkAnd(value => value > 40)).toBe(true);
    });

    it('isOkAnd should return false for non-matching predicate', () => {
      expect(okResult.isOkAnd(value => value < 40)).toBe(false);
    });

    it('isErrAnd should always return false', () => {
      expect(okResult.isErrAnd(() => true)).toBe(false);
    });

    it('unwrap should return the value', () => {
      expect(okResult.unwrap()).toBe(42);
    });

    it('unwrapOr should return the value', () => {
      expect(okResult.unwrapOr(0)).toBe(42);
    });

    it('unwrapErr should throw UnwrapError', () => {
      expect(() => okResult.unwrapErr()).toThrow(
        "Called `unwrapErr` on an `Ok` value",
      );
    });

    it('unwrapOrElse should return the value', () => {
      expect(okResult.unwrapOrElse(() => 0)).toBe(42);
    });

    it('and should return the other result', () => {
      const other = ok('test');
      expect(okResult.and(other)).toBe(other);
    });

    it('andThen should apply the function', () => {
      expect(okResult.andThen(value => ok(value * 2))).toEqual(ok(84));
    });

    it('map should apply the function', () => {
      expect(okResult.map(value => value * 2)).toEqual(ok(84));
    });

    it('mapErr should return the original result', () => {
      expect(okResult.mapErr(() => 'new error')).toBe(okResult);
    });

    it('mapOrElse should apply the ok function', () => {
      expect(okResult.mapOrElse(() => 0, value => value * 2)).toBe(84);
    });

    it('flatten should return the inner result', () => {
      const nestedOk = ok(ok(42));
      expect(nestedOk.flatten()).toEqual(ok(42));
    });

    it('inspect should call the function and return self', () => {
      const mockFn = jest.fn();
      const result = okResult.inspect(mockFn);
      expect(mockFn).toHaveBeenCalledWith(42);
      expect(result).toBe(okResult);
    });

    it('inspectErr should return self without calling the function', () => {
      const mockFn = jest.fn();
      const result = okResult.inspectErr(mockFn);
      expect(mockFn).not.toHaveBeenCalled();
      expect(result).toBe(okResult);
    });
  });

  describe('Err', () => {
    const errResult: Result<number, string> = err('error');

    it('isOk should return false', () => {
      expect(errResult.isOk()).toBe(false);
    });

    it('isErr should return true', () => {
      expect(errResult.isErr()).toBe(true);
    });

    it('isOkAnd should always return false', () => {
      expect(errResult.isOkAnd(() => true)).toBe(false);
    });

    it('isErrAnd should return true for matching predicate', () => {
      expect(errResult.isErrAnd(error => error === 'error')).toBe(true);
    });

    it('isErrAnd should return false for non-matching predicate', () => {
      expect(errResult.isErrAnd(error => error === 'other')).toBe(false);
    });

    it('unwrap should throw UnwrapError', () => {
      expect(() => errResult.unwrap()).toThrow(
        "Called `unwrap` on an `Err` value",
      );
    });

    it('unwrapOr should return the default value', () => {
      expect(errResult.unwrapOr(0)).toBe(0);
    });

    it('unwrapErr should return the error', () => {
      expect(errResult.unwrapErr()).toBe('error');
    });

    it('unwrapOrElse should return the result of the function', () => {
      expect(errResult.unwrapOrElse(() => 0)).toBe(0);
    });

    it('and should return the original error', () => {
      const other = ok(42);
      expect(errResult.and(other)).toBe(errResult);
    });

    it('andThen should return the original error', () => {
      expect(errResult.andThen(() => ok(42))).toBe(errResult);
    });

    it('map should return the original error', () => {
      expect(errResult.map(value => value * 2)).toBe(errResult);
    });

    it('mapErr should apply the function', () => {
      expect(errResult.mapErr(error => error.toUpperCase())).toEqual(err('ERROR'));
    });

    it('mapOrElse should apply the err function', () => {
      expect(errResult.mapOrElse(error => error.length, () => 0)).toBe(5);
    });

    it('flatten should return the original error', () => {
      expect(errResult.flatten()).toBe(errResult);
    });

    it('inspect should return self without calling the function', () => {
      const mockFn = jest.fn();
      const result = errResult.inspect(mockFn);
      expect(mockFn).not.toHaveBeenCalled();
      expect(result).toBe(errResult);
    });

    it('inspectErr should call the function and return self', () => {
      const mockFn = jest.fn();
      const result = errResult.inspectErr(mockFn);
      expect(mockFn).toHaveBeenCalledWith('error');
      expect(result).toBe(errResult);
    });
  });
});
