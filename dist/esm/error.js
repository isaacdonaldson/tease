export class TaggedError extends Error {
}
export function isTaggedError(err) {
    return err instanceof Error && err instanceof TaggedError;
}
