# tease

A TypeScript utility library providing functional-inspired error handling, iteration patterns, and composition.

Can be installed with
`$ npm install https://github.com/isaacdonaldson/tease`

And then used with both JavaScript and TypeScript files. For example:
`$ npx tsc index.ts --target esnext --lib esnext,dom --module commonjs --outDir dist`
Then running:
`$ node dist/index.js`

# Result API

A TypeScript implementation of Rust-like Result type for robust error handling. Result represents either success (Ok) or failure (Err).

## Overview

The Result type provides a way to handle operations that might fail, forcing explicit error handling and eliminating runtime exceptions. It's particularly useful for:

- Error handling without exceptions
- Chaining operations that might fail
- Converting null/undefined to explicit errors
- Working with async operations

## Basic Usage

```typescript
import { Result } from "tease";

// Creating Results
const ok = Result.ok(42); // Ok value
const err = Result.err(new Error("failed")); // Error value

// From nullable values
const fromNull = Result.fromNullable(possiblyNullValue);
const withCustomError = Result.fromNullableWithError(possiblyNullValue, new Error("Custom error"));

// Try/catch alternative
const result = Result.try(() => {
  // might throw
  return riskyOperation();
});

// Async operations
const asyncResult = await Result.asyncTry(async () => {
  // might throw
  return await riskyAsyncOperation();
});
```

### Chaining Operations

```typescript
const result = Result.ok(5)
  .map((x) => x * 2)
  .andThen((x) => (x > 5 ? Result.ok(x) : Result.err("too small")))
  .mapErr((err) => new Error(err));

// Safe unwrapping
const value = result.unwrapOr(0);
```

### Easy to use Error Handling with Supplied Functions

```typescript
const message = result.mapOrElse(
  (error) => `Failed: ${error.message}`,
  (value) => `Success: ${value}`,
);
```

### Working with Options

```typescript
const result: Result<number, Error> = Result.ok(42);

// Convert to Option
const okOption = result.ok(); // Some(42) if Ok
const errOption = result.err(); // None if Ok

const err: Result<number, Error> = Result.err(new Error("failed"));
const okOption = err.ok(); // None if Err
const errOption = err.err(); // Some(Error) if Err
```

## API Reference

### Creation Methods

```typescript
// Create Results
Result.ok<T>(value: T): Result<T, never>
Result.err<E>(error: E): Result<never, E>

// From nullable values
Result.fromNullable<T>(value: T): Result<T, string>
Result.fromNullableWithError<T, E>(value: T, error: E): Result<T, E>

// Try operations
Result.try<T>(fn: () => T): Result<T, Error>
Result.asyncTry<T>(fn: () => Promise<T>): Promise<Result<T, Error>>

// Type checking
Result.isResult<T, E>(value: unknown): value is Result<T, E>
```

### Instance Methods

#### Basic Checks

```typescript
isOk(): boolean                              // Returns true if Ok
isErr(): boolean                             // Returns true if Err
isOkAnd(pred: (value: T) => boolean)        // Returns true if Ok and predicate matches
isErrAnd(pred: (error: E) => boolean)       // Returns true if Err and predicate matches
```

#### Extracting Values

```typescript
unwrap(): T                                 // Get value or throw if Err
unwrapOr<U>(defaultValue: U): T | U        // Get value or return default
unwrapErr(): E                             // Get error or throw if Ok
unwrapOrElse<U>(fn: (error: E) => U): T | U // Get value or compute from error
```

#### Transformations

```typescript
map<U>(fn: (value: T) => U): Result<U, E>           // Transform Ok value
mapErr<F>(fn: (error: E) => F): Result<T, F>        // Transform Err value
flatten<U>(): Result<U, E>                          // Flatten nested Result
```

#### Combining Results

```typescript
and<U, F>(other: Result<U, F>): Result<U, F>        // Returns other if Ok
andThen<U, F>(fn: (value: T) => Result<U, F>)       // Chain Result-returning functions
or<U, F>(other: Result<U, F>): Result<T | U, F>     // Returns self if Ok, other if Err
```

#### Pattern Matching

```typescript
mapOrElse<U>(
  onErr: (error: E) => U,
  onOk: (value: T) => U
): U                                               // Transform with separate Ok/Err handling
```

#### Debugging

```typescript
inspect(fn: (value: T) => void): Result<T, E>      // Execute function on Ok value
inspectErr(fn: (error: E) => void): Result<T, E>   // Execute function on Err value
```

#### Conversion

```typescript
ok(): Option<T>                                    // Convert to Option (Some if Ok)
err(): Option<E>                                   // Convert to Option (Some if Err)
```

## Examples

### Error Handling in Functions

```typescript
function divide(a: number, b: number): Result<number, string> {
  return b === 0 ? Result.err("Division by zero") : Result.ok(a / b);
}

const result = divide(10, 2)
  .map((x) => x * 2)
  .mapErr((err) => new Error(err));
```

### Chaining Database Operations

```typescript
async function getUserData(id: string): Promise<Result<UserData, Error>> {
  return await Result.asyncTry(async () => {
    const user = await db.users.findOne(id);
    if (!user) {
      throw new Error(`User ${id} not found`);
    }
    return user;
  });
}

const result = await getUserData("123")
  .andThen((user) => getUserPosts(user.id))
  .mapErr((error) => ({
    code: 500,
    message: error.message,
  }));
```

### Form Validation

```typescript
function validateForm(input: unknown): Result<FormData, ValidationError> {
  return Result.try(() => {
    if (typeof input !== "object" || !input) {
      throw new ValidationError("Invalid input");
    }

    // Validation logic
    return parseFormData(input);
  });
}

const result = validateForm(rawData)
  .map(normalizeData)
  .mapErr((error) => ({
    field: error.field,
    message: error.message,
  }));
```

### Safe JSON Parsing

```typescript
function parseJSON<T>(input: string): Result<T, Error> {
  return Result.try(() => JSON.parse(input));
}

const config = parseJSON<Config>(rawConfig).unwrapOr(defaultConfig);
```

## Notes

- All operations are type-safe
- No runtime exceptions from Result operations
- Seamless integration with Option type
- Method chaining for clean error handling
- Rust-inspired design patterns

# Option API

A TypeScript implementation of Rust-like Option type for handling nullable values in a type-safe way.

## Overview

The Option type represents an optional value: every Option is either Some and contains a value, or None, representing no value. This provides a safe way to handle null or undefined values without runtime errors.

Key features:

- Type-safe null handling
- Chainable operations
- Seamless integration with Result type
- Comprehensive transformation methods

## Basic Usage

```typescript
import { Option } from "tease";

// Creating Options
const some = Option.some(42);
const none = Option.none();
const fromNullable = Option.fromNullable(possiblyNullValue);

// Basic operations
if (some.isSome()) {
  console.log(some.unwrap()); // 42
}

// Safe unwrapping with default
const value = none.unwrapOr(10); // 10
```

### Chaining Operations

```typescript
const result = Option.some(5)
  .map((x) => x * 2)
  .filter((x) => x > 5)
  .unwrapOr(0);

console.log(result); // 10
```

### Easy to use Error Handling with Supplied Functions

```typescript
const result = Option.fromNullable(user).mapOrElse(
  () => "Guest", // Run on None
  (user) => user.name, // Run on Some
);
```

### Working with Nested Options

```typescript
const nested = Option.some(Option.some(42));
const flattened = nested.flatten(); // Option.some(42)

// Chaining with andThen
const result = Option.some(5)
  .andThen((x) => Option.some(x * 2))
  .andThen((x) => (x > 5 ? Option.some(x) : Option.none()));
```

### Converting to Result

```typescript
const option = Option.some(42);
const result = option.okOr("error"); // Result.ok(42)

const none = Option.none();
const errorResult = none.okOr("error"); // Result.err("error")
```

## API Reference

### Creation Methods

```typescript
// Create Some value
Option.some<T>(value: NonNullable<T>): Option<T>

// Create None value
Option.none(): Option<T>

// Create from nullable value
Option.fromNullable<T>(value: T | null | undefined): Option<T>
```

### Instance Methods

#### Basic Checks

```typescript
isSome(): boolean                         // Returns true if Option is Some
isNone(): boolean                         // Returns true if Option is None
isSomeAnd(pred: (value: T) => boolean)    // Returns true if Some and predicate matches
```

#### Extracting Values

```typescript
unwrap(): T                               // Get value or throw if None
unwrapOr<U>(defaultValue: U): T | U      // Get value or return default
unwrapOrElse<U>(fn: () => U): T | U     // Get value or compute default
```

#### Transformations

```typescript
map<U>(fn: (value: T) => NonNullable<U>): Option<U>        // Transform Some value
filter(pred: (value: T) => boolean): Option<T>             // Filter based on predicate
flatten<U>(this: Option<Option<U>>): Option<U>            // Flatten nested Option
```

#### Combining Options

```typescript
and<U>(other: Option<U>): Option<U>                      // Returns other if Some, None if None
andThen<U>(fn: (value: T) => Option<U>): Option<U>      // Chain Option-returning functions
or(other: Option<T>): Option<T>                         // Returns self if Some, other if None
```

#### Pattern Matching

```typescript
mapOrElse<U>(
  onNone: () => U,
  onSome: (value: T) => U
): U                                                    // Transform with separate None/Some handling
```

#### Debugging

```typescript
inspect(fn: (value: T) => void): Option<T>             // Execute function on value if Some
```

#### Conversion

```typescript
okOr<E>(err: E): Result<T, E>                         // Convert to Result
```

## Usage Examples

### Optional Chaining

```typescript
type User = {
  name: string;
  address?: {
    street?: string;
  };
};

function getStreet(user: User): Option<string> {
  return Option.fromNullable(user.address).andThen((address) => Option.fromNullable(address.street));
}

const user: User = { name: "John" };
console.log(getStreet(user).unwrapOr("No street")); // "No street"
```

### Handling Computations That Might Fail

```typescript
function divide(numerator: number, denominator: number): Option<number> {
  return denominator === 0 ? Option.none() : Option.some(numerator / denominator);
}

const result = divide(10, 2)
  .map((x) => x * 2)
  .unwrapOr(0);

console.log(result); // 10
```

### Collection Operations

```typescript
const numbers = [1, 2, 3, 4, 5];

const firstEven = numbers.find((n) => n % 2 === 0); // possibly undefined

const safeFirstEven = Option.fromNullable(firstEven)
  .map((n) => n * 2)
  .unwrapOr(0);
```

### Form Validation

```typescript
type ValidationResult = {
  value: string;
  isValid: boolean;
};

function validateInput(input: string): Option<ValidationResult> {
  if (input.length < 3) {
    return Option.none();
  }
  return Option.some({
    value: input,
    isValid: true,
  });
}

const input = "ab";
const result = validateInput(input).mapOrElse(
  () => "Input too short",
  (result) => `Valid input: ${result.value}`,
);
```

## Notes

- All operations are type-safe and null-safe
- Option implements common functional programming patterns
- Seamless integration with Result type for error handling
- Method chaining enables clean and readable code
- Pattern matching through mapOrElse provides flexible control flow

# Defer API

Providing Zig-inspired `defer` and `errdefer` functionality for handling cleanup and error scenarios in both synchronous and asynchronous contexts.

## Overview

The Defer API provides two main functions:

- `withDefer`: For synchronous operations
- `withAsyncDefer`: For asynchronous operations

Both functions allow you to register callbacks that will be executed:

- After the main function completes (using `defer`)
- Only if an error occurs (using `errdefer`)

## Usage

### Basic Synchronous Example

```typescript
import { withDefer } from "tease";

const result = withDefer((defer, errdefer) => {
  // This will run after the function completes, regardless of success/failure
  defer(() => console.log("Cleanup complete"));

  // This will only run if an error occurs
  errdefer((err) => console.error("Error occurred:", err));

  // Your main logic here
  return "Success!";
});

// result is Result.ok("Success!")
```

### Basic Async Example

```typescript
import { withAsyncDefer } from "tease";

const result = await withAsyncDefer(async (defer, errdefer) => {
  // This will run after the async function completes
  defer(async () => {
    await cleanup();
    console.log("Async cleanup complete");
  });

  // This will only run if an error occurs
  errdefer(async (err) => {
    await logError(err);
    console.error("Async error occurred:", err);
  });

  // Your async logic here
  const data = await fetchData();
  return data;
});
```

### Real-world Example: File Operations

```typescript
import { withDefer } from "tease";
import * as fs from "fs";

function processFile(filepath: string) {
  return withDefer<string, Error>((defer, errdefer) => {
    const fd = fs.openSync(filepath, "r");

    // Always close the file descriptor
    defer(() => fs.closeSync(fd));

    // Log errors if they occur
    errdefer((err) => {
      console.error(`Error processing file ${filepath}:`, err);
    });

    // Process the file
    const content = fs.readFileSync(fd, "utf-8");
    return content;
  });
}
```

### Database Connection Example

```typescript
import { withAsyncDefer } from "tease";
import { Pool, PoolClient } from "pg";

async function executeTransaction<T>(pool: Pool, operation: (client: PoolClient) => Promise<T>) {
  return await withAsyncDefer(async (defer, errdefer) => {
    const client = await pool.connect();

    // Always release the client back to the pool
    defer(async () => client.release());

    // Rollback on error
    errdefer(async () => {
      await client.query("ROLLBACK");
    });

    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");

    return result;
  });
}
```

## API Reference

### withDefer

```typescript
function withDefer<T, E>(fn: (defer: DeferFn, errdefer: ErrdeferFn<E>) => T): Result<T, E>;
```

- `T`: The return type of the main function
- `E`: The error type
- Returns a `Result<T, E>` containing either the success value or error

### withAsyncDefer

```typescript
function withAsyncDefer<T, E>(
  fn: (defer: AsyncDeferFn, errdefer: AsyncErrdeferFn<E>) => Promise<T>,
): Promise<Result<T, E>>;
```

- `T`: The return type of the main async function
- `E`: The error type
- Returns a Promise of `Result<T, E>` containing either the success value or error

## Notes

- LIFO (Last In, First Out) execution of deferred callbacks
- Nested defer support

# Iterator API

A lazy iterator implementation providing functional programming patterns with more efficient evaluation.

## Overview

The Iterator API provides a chainable interface for working with sequences of values. Operations are evaluated lazily, meaning they are only computed when the final result is needed.

Key features:

- Lazy evaluation
- Chain-able operations
- Type-safe transformations
- Error handling with Result type
- Memory efficient processing

## Basic Usage

```typescript
import { Iterator } from "tease";

// Transform and filter numbers
const result = Iterator.from([1, 2, 3, 4, 5])
  .map((x) => x * 2)
  .filter((x) => x > 5)
  .collect()
  .unwrap();

console.log(result); // [6, 8, 10]
```

### Lazy Evaluation Example

```typescript
const iter = Iterator.from([1, 2, 3, 4, 5])
  .map((x) => {
    console.log(`Mapping ${x}`);
    return x * 2;
  })
  .filter((x) => x > 5);

// Nothing is logged yet because no operations have been performed
console.log("Before collection");

const result = iter.collect().unwrap();
// Now the mapping operations are performed
```

### Working with Different Types

```typescript
const numbers = Iterator.from(["1", "2", "3", "a", "4"])
  .filterMap((str) => {
    const num = parseInt(str);
    return isNaN(num) ? Option.none() : Option.some(num);
  })
  .collect()
  .unwrap();

console.log(numbers); // [1, 2, 3, 4]
```

### Chunking Data

```typescript
const chunks = Iterator.from([1, 2, 3, 4, 5]).chunk(2).unwrap().collect().unwrap();

console.log(chunks); // [[1, 2], [3, 4], [5]]
```

### Grouping and Sorting

```typescript
// Group numbers by even/odd
const groups = Iterator.from([1, 2, 3, 4, 5])
  .groupBy((x) => (x % 2 === 0 ? "even" : "odd"))
  .unwrap();

// Sort numbers descending
const sorted = Iterator.from([3, 1, 4, 1, 5])
  .sortBy((a, b) => b - a)
  .unwrap()
  .collect()
  .unwrap();
```

## API Reference

### Creation

- `Iterator.from<T>(source: Iterable<T>)`: Create a new iterator from any iterable

### Transformation Methods

- `map<U>(fn: (value: T) => U)`: Transform each element
- `filter(fn: (value: T) => boolean)`: Keep only elements matching predicate
- `filterMap<U>(fn: (value: T) => Option<U>)`: Combined filter and map operation
- `take(n: number)`: Take first n elements
- `skip(n: number)`: Skip first n elements
- `reverse()`: Reverse the order of elements

### Element Access

- `nth(n: number)`: Get the nth element
- `last()`: Get the last element
- `find(predicate: (value: T) => boolean)`: Find first matching element
- `position(predicate: (value: T) => boolean)`: Find index of first match

### Grouping and Collecting

- `chunk(size: number)`: Group elements into fixed-size chunks
- `zip<U>(other: Iterable<U>)`: Pair elements with another iterator
- `unzip()`: Split an iterator of pairs into two arrays
- `groupBy<K>(keyFn: (value: T) => K)`: Group elements by key function
- `sortBy(compareFn: (a: T, b: T) => number)`: Sort elements

### Reduction Methods

- `reduce(fn: (acc: T, value: T) => T)`: Reduce to single value using first element as initial
- `fold<U>(fn: (acc: U, value: T) => U, initial: U)`: Reduce with initial value
- `collect()`: Convert iterator to array

### Testing Methods

- `some(predicate: (value: T) => boolean)`: Test if any element matches
- `all(predicate: (value: T) => boolean)`: Test if all elements match

### Debugging

- `tap(fn: (value: T) => void)`: Execute side effect for each element
- `debug(prefix?: string)`: Log each element with optional prefix

## Notes

- Lazy evaluation ensures more efficient processing of large sequences
- All operations maintain type safety
- Error handling through Result type

# Pipe API

A TypeScript implementation of functional programming pipelines that support both synchronous and asynchronous operations with robust error handling.

## Overview

The Pipe API provides two main functions for composing operations:

- `pipe`: Handles both synchronous and asynchronous functions
- `syncPipe`: Optimized for synchronous-only operations

Key features:

- Type-safe function composition
- Automatic error handling with Result type
- Support for mixed sync/async operations
- Guaranteed execution order
- Early termination on errors

## Basic Usage

```typescript
import { pipe, syncPipe } from "tease";

// Synchronous pipeline
const syncResult = syncPipe(
  5,
  (x) => x * 2,
  (x) => x + 1,
  (x) => x.toString(),
);

// Async pipeline
const asyncResult = await pipe(
  5,
  async (x) => x * 2,
  (x) => x + 1,
  async (x) => x.toString(),
);
```

### Error Handling

```typescript
// Errors are automatically caught and wrapped in Result
const result = await pipe(userInput, validateInput, async (data) => await saveToDatabase(data), sendNotification);

if (result.isErr()) {
  console.error("Pipeline failed:", result.unwrapErr());
}
```

### Mixed Sync/Async Operations

```typescript
const result = await pipe(
  initialData,
  validateSync, // synchronous
  async (x) => fetchData(x), // asynchronous
  transformSync, // synchronous
  async (x) => saveData(x), // asynchronous
);
```

## API Reference

### Pipe Functions

```typescript
// Async-capable pipe
async function pipe<Fns extends PipeFunction<any, any>[]>(
  startVal: unknown,
  ...fns: Fns
): Promise<Result<PipeChain<Fns>, Error>>;

// Synchronous-only pipe
function syncPipe<Fns extends SyncFunction<any, any>[]>(
  startVal: unknown,
  ...fns: Fns
): Result<SyncPipeChain<Fns>, Error>;
```

### Type Definitions

```typescript
// Function types
type AsyncFunction<T, U> = (arg: T) => Promise<U>;
type SyncFunction<T, U> = (arg: T) => U;
type PipeFunction<T, U> = AsyncFunction<T, U> | SyncFunction<T, U>;
```

## Examples

### Data Transformation Pipeline

```typescript
// Define transform functions
const parseData = (raw: string): object => JSON.parse(raw);
const validate = (data: object): Result<ValidData, Error> => {
  // Validation logic
  return isValid ? Result.ok(data) : Result.err(new Error("Invalid data"));
};
const normalize = async (data: ValidData) => {
  // Async normalization
  return normalizedData;
};

// Create pipeline
const processData = async (rawData: string) => {
  return await pipe(rawData, parseData, validate, normalize, (data) => ({ processed: true, ...data }));
};
```

### API Request Pipeline

```typescript
const fetchUserData = async (userId: string) => {
  return await pipe(
    userId,
    async (id) => await api.fetchUser(id),
    (user) => validateUser(user),
    async (user) => await enrichUserData(user),
    (user) => transformResponse(user),
  );
};
```

### Form Processing Pipeline

```typescript
const processForm = (formData: unknown) => {
  return syncPipe(formData, validateFormData, normalizeFormData, (data) => Result.ok(prepareForStorage(data)));
};
```

### Database Operations

```typescript
const saveUser = async (userData: UserInput) => {
  return await pipe(
    userData,
    validateUserData,
    async (data) => await checkDuplicates(data),
    async (data) =>
      await db.transaction(async () => {
        const user = await db.users.create(data);
        return user;
      }),
    async (user) => await sendWelcomeEmail(user),
  );
};
```

## Best Practices

1. Error Handling

```typescript
// Handle errors at the end of the pipeline
const result = await pipe(input, process1, process2).then((result) =>
  result.mapOrElse(
    (error) => handleError(error),
    (success) => handleSuccess(success),
  ),
);
```

2. Type Safety

```typescript
// Leverage TypeScript for type safety
const typedPipe = await pipe(
  5,
  (x: number) => x * 2,
  (x: number) => x.toString(),
  (x: string) => parseInt(x),
);
```

3. Modular Functions

```typescript
// Keep pipeline functions pure and focused
const validateAge = (age: number) => (age >= 0 ? Result.ok(age) : Result.err(new Error("Invalid age")));

const processAge = syncPipe(userInput.age, parseFloat, validateAge, (age) => ({ age, isAdult: age >= 18 }));
```

## Notes

- All functions in the pipeline receive the output of the previous function
- Errors are automatically caught and wrapped in Result
- Pipelines can be composed of any mixture of sync and async functions
- Early error termination prevents unnecessary computation
- Type inference works across the entire pipeline
- Results can be easily combined with Option and Result types
