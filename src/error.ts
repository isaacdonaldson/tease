export abstract class TaggedError extends Error {
  abstract readonly _tag: string;
}

export function isTaggedError(err: Error): err is TaggedError {
  return err instanceof Error && err instanceof TaggedError;
}
