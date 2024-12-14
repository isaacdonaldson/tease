export declare abstract class TaggedError extends Error {
    abstract readonly _tag: string;
}
export declare function isTaggedError(err: Error): err is TaggedError;
