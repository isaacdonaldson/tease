export declare function isNullable<T>(value: T | null | undefined): value is null | undefined;
export declare function isNonNullable<T>(value: T): value is T;
export declare function isPromise<T>(value: T | Promise<T>): value is Promise<T>;
