import { some, none, Option } from "../src/option";
import { ok, err } from "./result"

describe("Option", () => {
  describe("Some", () => {
    let someValue: Option<number>;

    beforeEach(() => {
      someValue = some(5);
    });

    test("isSome returns true", () => {
      expect(someValue.isSome()).toBe(true);
    });

    test("isNone returns false", () => {
      expect(someValue.isNone()).toBe(false);
    });

    test("isSomeAnd returns true for matching predicate", () => {
      expect(someValue.isSomeAnd((v) => v > 3)).toBe(true);
    });

    test("isSomeAnd returns false for non-matching predicate", () => {
      expect(someValue.isSomeAnd((v) => v < 3)).toBe(false);
    });

    test("unwrap returns the value", () => {
      expect(someValue.unwrap()).toBe(5);
    });

    test("unwrapOr returns the value", () => {
      expect(someValue.unwrapOr(10)).toBe(5);
    });

    test("unwrapOrElse returns the value", () => {
      expect(someValue.unwrapOrElse(() => 10)).toBe(5);
    });

    test("and returns the other option", () => {
      const other = some(10);
      expect(someValue.and(other)).toBe(other);
    });

    test("andThen applies the function", () => {
      const result = someValue.andThen((v) => some(v * 2));
      expect(result.unwrap()).toBe(10);
    });

    test("map applies the function", () => {
      const result = someValue.map((v) => v * 2);
      expect(result.unwrap()).toBe(10);
    });

    test("mapOrElse applies the onSome function", () => {
      const result = someValue.mapOrElse(
        () => 0,
        (v) => v * 2,
      );
      expect(result).toBe(10);
    });

    test("filter returns Some for matching predicate", () => {
      const result = someValue.filter((v) => v > 3);
      expect(result.isSome()).toBe(true);
      expect(result.unwrap()).toBe(5);
    });

    test("filter returns None for non-matching predicate", () => {
      const result = someValue.filter((v) => v < 3);
      expect(result.isNone()).toBe(true);
    });

    test("flatten returns the inner Some for Option type", () => {
      const nestedOption = some(some(5));
      expect(nestedOption.flatten()).toStrictEqual(some(5));
    });

    test("flatten returns the inner None for Option type", () => {
      const nestedOption = some(none());
      expect(nestedOption.flatten()).toStrictEqual(none());
    });

    test("flatten returns the None for None type", () => {
      const nestedOption = none()
      expect(nestedOption.flatten()).toStrictEqual(none());
    });

    test("inspect calls the function with the value", () => {
      const mockFn = jest.fn();
      const result = someValue.inspect(mockFn);
      expect(mockFn).toHaveBeenCalledWith(5);
      expect(result).toBe(someValue);
    });

    test("or returns the original Some", () => {
      const other = some(10);
      expect(someValue.or(other)).toBe(someValue);
    });

    test("ok_or returns the original option", () => {
      expect(someValue.ok_or(42)).toStrictEqual(ok(5));
    });
  });

  describe("none", () => {
    let noneValue = none();

    beforeEach(() => {
      noneValue = none();
    });

    test("isSome returns false", () => {
      expect(noneValue.isSome()).toBe(false);
    });

    test("isNone returns true", () => {
      expect(noneValue.isNone()).toBe(true);
    });

    test("isSomeAnd always returns false", () => {
      expect(noneValue.isSomeAnd(() => true)).toBe(false);
    });

    test("unwrap throws UnwrapError", () => {
      expect(() => noneValue.unwrap()).toThrow(
        "Called `unwrap` on a `None` value",
      );
    });

    test("unwrapOr returns the default value", () => {
      expect(noneValue.unwrapOr(10)).toBe(10);
    });

    test("unwrapOrElse calls the function", () => {
      const mockFn = jest.fn(() => 10);
      expect(noneValue.unwrapOrElse(mockFn)).toBe(10);
      expect(mockFn).toHaveBeenCalled();
    });

    test("and returns None", () => {
      const other = some(10);
      expect(noneValue.and(other)).toBe(noneValue);
    });

    test("andThen returns None", () => {
      const mockFn = jest.fn();
      expect(noneValue.andThen(mockFn)).toBe(noneValue);
      expect(mockFn).not.toHaveBeenCalled();
    });

    test("map returns None", () => {
      const mockFn = jest.fn();
      expect(noneValue.map(mockFn)).toBe(noneValue);
      expect(mockFn).not.toHaveBeenCalled();
    });

    test("mapOrElse calls the onNone function", () => {
      const onNone = jest.fn(() => "default");
      const onSome = jest.fn();
      expect(noneValue.mapOrElse(onNone, onSome)).toBe("default");
      expect(onNone).toHaveBeenCalled();
      expect(onSome).not.toHaveBeenCalled();
    });

    test("filter returns None", () => {
      const mockFn = jest.fn();
      expect(noneValue.filter(mockFn)).toBe(noneValue);
      expect(mockFn).not.toHaveBeenCalled();
    });

    test("flatten returns None", () => {
      expect(noneValue.flatten()).toBe(noneValue);
    });

    test("inspect does not call the function", () => {
      const mockFn = jest.fn();
      const result = noneValue.inspect(mockFn);
      expect(mockFn).not.toHaveBeenCalled();
      expect(result).toBe(noneValue);
    });

    test("or returns the other option", () => {
      const other = some(10);
      expect(noneValue.or(other)).toBe(other);
    });

    test("ok_or returns the other option", () => {
      expect(noneValue.ok_or(42)).toStrictEqual(err(42));
    });
  });
});
