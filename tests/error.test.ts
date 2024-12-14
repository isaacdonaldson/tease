import { TaggedError, isTaggedError } from "@/error";

describe("TaggedError", () => {
  it("should have a _tag property", () => {
    class TestTaggedError extends TaggedError {
      readonly _tag = "test";
    }

    const error = new TestTaggedError();
    expect(error._tag).toBe("test");
  });
});

describe("isTaggedError", () => {
  it("should return true for TaggedError instances", () => {
    class TestTaggedError extends TaggedError {
      readonly _tag = "test";
    }

    const error = new TestTaggedError();
    expect(isTaggedError(error)).toBe(true);
  });

  it("should return false for non-TaggedError instances", () => {
    const error = new Error();
    expect(isTaggedError(error)).toBe(false);
  });
});
