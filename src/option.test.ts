import { Option } from "../src/option";
import { Result } from "./result";

describe("Option", () => {
  describe("Some", () => {
    let someValue: Option<number>;

    beforeEach(() => {
      someValue = Option.some(5);
    });

    it("isSome returns true", () => {
      expect(someValue.isSome()).toBe(true);
    });

    it("isNone returns false", () => {
      expect(someValue.isNone()).toBe(false);
    });

    it("isSomeAnd returns true for matching predicate", () => {
      expect(someValue.isSomeAnd((v) => v > 3)).toBe(true);
    });

    it("isSomeAnd returns false for non-matching predicate", () => {
      expect(someValue.isSomeAnd((v) => v < 3)).toBe(false);
    });

    it("unwrap returns the value", () => {
      expect(someValue.unwrap()).toBe(5);
    });

    it("unwrapOr returns the value", () => {
      expect(someValue.unwrapOr(10)).toBe(5);
    });

    it("unwrapOrElse returns the value", () => {
      expect(someValue.unwrapOrElse(() => 10)).toBe(5);
    });

    it("and returns the other option", () => {
      const other = Option.some(10);
      expect(someValue.and(other)).toBe(other);
    });

    it("andThen applies the function", () => {
      const result = someValue.andThen((v) => Option.some(v * 2));
      expect(result.unwrap()).toBe(10);
    });

    it("map applies the function", () => {
      const result = someValue.map((v) => v * 2);
      expect(result.unwrap()).toBe(10);
    });

    it("mapOrElse applies the onSome function", () => {
      const result = someValue.mapOrElse(
        () => 0,
        (v) => v * 2,
      );
      expect(result).toBe(10);
    });

    it("filter returns Some for matching predicate", () => {
      const result = someValue.filter((v) => v > 3);
      expect(result.isSome()).toBe(true);
      expect(result.unwrap()).toBe(5);
    });

    it("filter returns None for non-matching predicate", () => {
      const result = someValue.filter((v) => v < 3);
      expect(result.isNone()).toBe(true);
    });

    it("flatten returns the inner Some for Option type", () => {
      const nestedOption = Option.some(Option.some(5));
      expect(nestedOption.flatten()).toStrictEqual(Option.some(5));
    });

    it("flatten returns the inner None for Option type", () => {
      const nestedOption = Option.some(Option.none());
      expect(nestedOption.flatten()).toStrictEqual(Option.none());
    });

    it("flatten returns the None for None type", () => {
      const nestedOption = Option.none();
      expect(nestedOption.flatten()).toStrictEqual(Option.none());
    });

    it("inspect calls the function with the value", () => {
      const mockFn = jest.fn();
      const result = someValue.inspect(mockFn);
      expect(mockFn).toHaveBeenCalledWith(5);
      expect(result).toBe(someValue);
    });

    it("or returns the original Some", () => {
      const other = Option.some(10);
      expect(someValue.or(other)).toBe(someValue);
    });

    it("okOr returns the original option", () => {
      expect(someValue.okOr(42)).toStrictEqual(Result.ok(5));
    });

    it("fromNullable should return Some for non-null values", () => {
      expect(Option.fromNullable(42).unwrap()).toBe(42);
      expect(Option.fromNullable("hello").unwrap()).toBe("hello");
      expect(Option.fromNullable({ key: "value" }).unwrap()).toEqual({
        key: "value",
      });
    });

    it("fromNullable should return Some for falsy non-null values", () => {
      expect(Option.fromNullable(0).unwrap()).toBe(0);
      expect(Option.fromNullable("").unwrap()).toBe("");
      expect(Option.fromNullable(false).unwrap()).toBe(false);
    });
  });

  describe("none", () => {
    let noneValue = Option.none();

    beforeEach(() => {
      noneValue = Option.none();
    });

    it("isSome returns false", () => {
      expect(noneValue.isSome()).toBe(false);
    });

    it("isNone returns true", () => {
      expect(noneValue.isNone()).toBe(true);
    });

    it("isSomeAnd always returns false", () => {
      expect(noneValue.isSomeAnd(() => true)).toBe(false);
    });

    it("unwrap throws UnwrapError", () => {
      expect(() => noneValue.unwrap()).toThrow(
        "Called `unwrap` on a `None` value",
      );
    });

    it("unwrapOr returns the default value", () => {
      expect(noneValue.unwrapOr(10)).toBe(10);
    });

    it("unwrapOrElse calls the function", () => {
      const mockFn = jest.fn(() => 10);
      expect(noneValue.unwrapOrElse(mockFn)).toBe(10);
      expect(mockFn).toHaveBeenCalled();
    });

    it("and returns None", () => {
      const other = Option.some(10);
      expect(noneValue.and(other)).toBe(noneValue);
    });

    it("andThen returns None", () => {
      const mockFn = jest.fn();
      expect(noneValue.andThen(mockFn)).toBe(noneValue);
      expect(mockFn).not.toHaveBeenCalled();
    });

    it("map returns None", () => {
      const mockFn = jest.fn();
      expect(noneValue.map(mockFn)).toBe(noneValue);
      expect(mockFn).not.toHaveBeenCalled();
    });

    it("mapOrElse calls the onNone function", () => {
      const onNone = jest.fn(() => "default");
      const onSome = jest.fn();
      expect(noneValue.mapOrElse(onNone, onSome)).toBe("default");
      expect(onNone).toHaveBeenCalled();
      expect(onSome).not.toHaveBeenCalled();
    });

    it("filter returns None", () => {
      const mockFn = jest.fn();
      expect(noneValue.filter(mockFn)).toBe(noneValue);
      expect(mockFn).not.toHaveBeenCalled();
    });

    it("flatten returns None", () => {
      expect(noneValue.flatten()).toBe(noneValue);
    });

    it("inspect does not call the function", () => {
      const mockFn = jest.fn();
      const result = noneValue.inspect(mockFn);
      expect(mockFn).not.toHaveBeenCalled();
      expect(result).toBe(noneValue);
    });

    it("or returns the other option", () => {
      const other = Option.some(10);
      expect(noneValue.or(other)).toBe(other);
    });

    it("okOr returns the other option", () => {
      expect(noneValue.okOr(42)).toStrictEqual(Result.err(42));
    });

    // it('fromNullable should return None for null or undefined', () => {
    //   const nullVal = Option.fromNullable(null)
    //   expect(nullVal.unwrapOr(5)).toBe(5);
    // });
  });
});
