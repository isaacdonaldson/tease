"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaggedError = void 0;
exports.isTaggedError = isTaggedError;
class TaggedError extends Error {
}
exports.TaggedError = TaggedError;
function isTaggedError(err) {
    return err instanceof Error && err instanceof TaggedError;
}
