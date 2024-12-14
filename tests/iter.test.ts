
import { Iterator } from "@/iter";
import { Option } from "@/option";

describe("LazyIterator", () => {
  describe("Lazy Evaluation", () => {
    it("should not execute operations until collect is called", () => {
      const mapSpy = jest.fn((x: number) => x * 2);
      const filterSpy = jest.fn((x: number) => x > 5);

      const iter = Iterator.from([1, 2, 3, 4, 5])
        .map(mapSpy)
        .filter(filterSpy);

      // No operations should have been performed yet
      expect(mapSpy).not.toHaveBeenCalled();
      expect(filterSpy).not.toHaveBeenCalled();

      // Now consume the iterator
      const result = iter.collect().unwrap();

      // Operations should have been performed exactly once per element
      expect(mapSpy).toHaveBeenCalledTimes(5);
      expect(filterSpy).toHaveBeenCalledTimes(5);
      expect(result).toEqual([6, 8, 10]);
    });

    it("should stop processing elements early when using take", () => {
      const mapSpy = jest.fn((x: number) => x * 2);
      const filterSpy = jest.fn((x: number) => x > 5);

      const result = Iterator.from([1, 2, 3, 4, 5])
        .map(mapSpy)
        .filter(filterSpy)
        .take(2)
        .collect()
        .unwrap();

      // Should only process until we get 2 elements that pass the filter
      expect(mapSpy).toHaveBeenCalledTimes(4); // Only needs to process 1,2,3,4 to get two elements > 2
      expect(filterSpy).toHaveBeenCalledTimes(4);
      expect(result).toEqual([6, 8]);
    });

    it("should be reusable and re-evaluate each time", () => {
      const mapSpy = jest.fn((x: number) => x * 2);

      const iter = Iterator.from([1, 2, 3]).map(mapSpy);

      // First consumption
      iter.collect().unwrap();
      expect(mapSpy).toHaveBeenCalledTimes(3);

      // Reset spy
      mapSpy.mockClear();

      // Second consumption
      iter.collect().unwrap();
      expect(mapSpy).toHaveBeenCalledTimes(3);
    });

    it("should only process necessary elements when finding first match", () => {
      const processSpy = jest.fn((x: number) => x > 3);

      Iterator.from([1, 2, 3, 4, 5]).find(processSpy);

      // Should stop after finding first match (4)
      expect(processSpy).toHaveBeenCalledTimes(4);
    });

    it("should evaluate elements one at a time", () => {
      const processed: number[] = [];
      const result = Iterator.from([1, 2, 3, 4, 5])
        .tap(x => processed.push(x))
        .map(x => x * 2)
        .filter(x => x > 5)
        .collect()
        .unwrap();

      // Elements should have been processed in order
      expect(processed).toEqual([1, 2, 3, 4, 5]);
      expect(result).toEqual([6, 8, 10]);
    });

    it("should handle infinite sequences with take", () => {
      function* infiniteSequence(): Generator<number> {
        let i = 1;
        while (true) {
          yield i++;
        }
      }

      const processSpy = jest.fn((x: number) => x * 2);

      const result = Iterator.from(infiniteSequence())
        .map(processSpy)
        .take(3)
        .collect()
        .unwrap();

      // Should only process the first 3 elements
      expect(processSpy).toHaveBeenCalledTimes(3);
      expect(result).toEqual([2, 4, 6]);
    });

    it("should short-circuit on first false in all()", () => {
      const predicateSpy = jest.fn((x: number) => x < 3);

      Iterator.from([1, 2, 3, 4, 5]).all(predicateSpy);

      // Should stop at 3 (first false)
      expect(predicateSpy).toHaveBeenCalledTimes(3);
    });

    it("should short-circuit on first true in some()", () => {
      const predicateSpy = jest.fn((x: number) => x > 3);

      Iterator.from([1, 2, 3, 4, 5]).some(predicateSpy);

      // Should stop at 4 (first true)
      expect(predicateSpy).toHaveBeenCalledTimes(4);
    });

    it("should evaluate chained operations in correct order", () => {
      const operations: string[] = [];

      Iterator.from([1, 2, 3])
        .tap(() => operations.push("first"))
        .map(x => {
          operations.push("map");
          return x * 2;
        })
        .filter(x => {
          operations.push("filter");
          return x > 2;
        })
        .collect()
        .unwrap();

      // Operations should be performed in order for each element
      expect(operations).toEqual([
        "first", "map", "filter",  // for 1
        "first", "map", "filter",  // for 2
        "first", "map", "filter"   // for 3
      ]);
    });

    it("should not evaluate skipped elements fully", () => {
      const mapSpy = jest.fn((x: number) => x * 2);
      const filterSpy = jest.fn((x: number) => x > 2);

      const result = Iterator.from([1, 2, 3, 4, 5])
        .skip(2)
        .map(mapSpy)
        .filter(filterSpy)
        .collect()
        .unwrap();

      // Should only process elements after skip
      expect(mapSpy).toHaveBeenCalledTimes(3); // Only 3,4,5 are processed
      expect(filterSpy).toHaveBeenCalledTimes(3);
      expect(result).toEqual([6, 8, 10]);
    });

    it("should not evaluate beyond needed elements in nth()", () => {
      const processSpy = jest.fn((x: number) => x * 2);

      Iterator.from([1, 2, 3, 4, 5])
        .map(processSpy)
        .nth(2);

      // Should only process up to the third element
      expect(processSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe("basic operations", () => {
    it("should create an iterator from an array", () => {
      const iter = Iterator.from([1, 2, 3]);
      expect(iter.collect().unwrap()).toEqual([1, 2, 3]);
    });

    it("should map values", () => {
      const result = Iterator.from([1, 2, 3])
        .map(x => x * 2)
        .collect()
        .unwrap();
      expect(result).toEqual([2, 4, 6]);
    });

    it("should map values to a different type", () => {
      const result = Iterator.from([1, 2, 3])
        .map(x => x.toString())
        .collect()
        .unwrap();
      expect(result).toEqual(['1', '2', '3']);
    });

    it("should filter values", () => {
      const result = Iterator.from([1, 2, 3, 4, 5])
        .filter(x => x % 2 === 0)
        .collect()
        .unwrap();

      console.log(result)
      expect(result).toEqual([2, 4]);
    });

    it("should handle empty iterators", () => {
      const result = Iterator.from([])
        .map(x => x)
        .collect()
        .unwrap();
      expect(result).toEqual([]);
    });
  });

  describe("take and skip operations", () => {
    it("should take first n elements", () => {
      const result = Iterator.from([1, 2, 3, 4, 5])
        .take(3)
        .collect()
        .unwrap();
      expect(result).toEqual([1, 2, 3]);
    });

    it("should handle take with n larger than array", () => {
      const result = Iterator.from([1, 2, 3])
        .take(5)
        .collect()
        .unwrap();
      expect(result).toEqual([1, 2, 3]);
    });

    it("should skip first n elements", () => {
      const result = Iterator.from([1, 2, 3, 4, 5])
        .skip(2)
        .collect()
        .unwrap();
      expect(result).toEqual([3, 4, 5]);
    });

    it("should handle skip with n larger than array", () => {
      const result = Iterator.from([1, 2, 3])
        .skip(5)
        .collect()
        .unwrap();
      expect(result).toEqual([]);
    });
  });

  describe("nth and last operations", () => {
    it("should get nth element", () => {
      const result = Iterator.from([1, 2, 3, 4, 5]).nth(2);
      expect(result.unwrap()).toBe(3);
    });

    it("should return None when nth is out of bounds", () => {
      const result = Iterator.from([1, 2, 3]).nth(5);
      expect(result.isNone()).toBe(true);
    });

    it("should get last element", () => {
      const result = Iterator.from([1, 2, 3]).last();
      expect(result.unwrap()).toBe(3);
    });

    it("should return None when getting last of empty iterator", () => {
      const result = Iterator.from([]).last();
      expect(result.isNone()).toBe(true);
    });
  });

  describe("chunk operation", () => {
    it("should chunk iterator into groups", () => {
      const result = Iterator.from([1, 2, 3, 4, 5])
        .chunk(2)
        .unwrap()
        .collect()
        .unwrap();
      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });

    it("should return error for negative chunk size", () => {
      const result = Iterator.from([1, 2, 3]).chunk(-1);
      expect(result.isErr()).toBe(true);
    });

    it("should return error for zero chunk size", () => {
      const result = Iterator.from([1, 2, 3]).chunk(0);
      expect(result.isErr()).toBe(true);
    });
  });

  describe("zip and unzip operations", () => {
    it("should zip two iterators", () => {
      const result = Iterator.from([1, 2, 3])
        .zip(['a', 'b', 'c'])
        .collect()
        .unwrap();
      expect(result).toEqual([[1, 'a'], [2, 'b'], [3, 'c']]);
    });

    it("should zip with shorter iterator", () => {
      const result = Iterator.from([1, 2, 3, 4])
        .zip(['a', 'b'])
        .collect()
        .unwrap();
      expect(result).toEqual([[1, 'a'], [2, 'b']]);
    });

    it("should unzip iterator of pairs", () => {
      // Must provide type hint for pairs to avoid type inference error
      const pairs: Array<[number, string]> = [[1, 'a'], [2, 'b'], [3, 'c']];
      const result = Iterator.from(pairs).unzip().unwrap();
      expect(result).toEqual([[1, 2, 3], ['a', 'b', 'c']]);
    });
  });

  describe("groupBy operation", () => {
    it("should group elements by key", () => {
      const result = Iterator.from([1, 2, 3, 4, 5])
        .groupBy(x => x % 2)
        .unwrap();
      expect(Array.from(result.entries())).toEqual([
        [1, [1, 3, 5]],
        [0, [2, 4]]
      ]);
    });

    it("should handle empty iterator", () => {
      const result = Iterator.from([])
        .groupBy(x => x)
        .unwrap();
      expect(result.size).toBe(0);
    });

    it("should return error when key function throws", () => {
      const result = Iterator.from([1, 2, 3]).groupBy(() => {
        throw new Error("key error");
      });
      expect(result.isErr()).toBe(true);
    });
  });

  describe("sortBy operation", () => {
    it("should sort elements", () => {
      const result = Iterator.from([3, 1, 4, 1, 5])
        .sortBy((a, b) => a - b)
        .unwrap()
        .collect()
        .unwrap();
      expect(result).toEqual([1, 1, 3, 4, 5]);
    });

    it("should return error when comparator throws", () => {
      const result = Iterator.from([1, 2, 3]).sortBy(() => {
        throw new Error("sort error");
      });
      expect(result.isErr()).toBe(true);
    });
  });

  describe("find and position operations", () => {
    it("should find matching element", () => {
      const result = Iterator.from([1, 2, 3, 4, 5]).find(x => x > 3);
      expect(result.unwrap()).toBe(4);
    });

    it("should return None when no match found", () => {
      const result = Iterator.from([1, 2, 3]).find(x => x > 5);
      expect(result.isNone()).toBe(true);
    });

    it("should find position of matching element", () => {
      const result = Iterator.from([1, 2, 3, 4, 5]).position(x => x > 3);
      expect(result.unwrap()).toBe(3);
    });

    it("should return None when no position found", () => {
      const result = Iterator.from([1, 2, 3]).position(x => x > 5);
      expect(result.isNone()).toBe(true);
    });
  });

  describe("reduce and fold operations", () => {
    it("should reduce elements", () => {
      const result = Iterator.from([1, 2, 3, 4, 5]).reduce((acc, x) => acc + x);
      expect(result.unwrap()).toBe(15);
    });

    it("should return None when reducing empty iterator", () => {
      const result = Iterator.from([]).reduce((acc, x) => acc + x as never);
      expect(result.isNone()).toBe(true);
    });

    it("should fold elements with initial value", () => {
      const result = Iterator.from([1, 2, 3])
        .fold((acc, x) => acc + x, 10)
        .unwrap();
      expect(result).toBe(16);
    });

    it("should return error when fold function throws", () => {
      const result = Iterator.from([1, 2, 3]).fold(() => {
        throw new Error("fold error");
      }, 0);
      expect(result.isErr()).toBe(true);
    });
  });

  describe("filter predicates", () => {
    it("should check if any element matches", () => {
      const hasEven = Iterator.from([1, 2, 3, 4, 5]).some(x => x % 2 === 0);
      expect(hasEven).toBe(true);
    });

    it("should check if all elements match", () => {
      const allPositive = Iterator.from([1, 2, 3, 4, 5]).all(x => x > 0);
      expect(allPositive).toBe(true);
    });

    it("should handle empty iterator for some", () => {
      const result = Iterator.from([]).some(() => true);
      expect(result).toBe(false);
    });

    it("should handle empty iterator for all", () => {
      const result = Iterator.from([]).all(() => false);
      expect(result).toBe(true);
    });
  });

  describe("reverse operation", () => {
    it("should reverse elements", () => {
      const result = Iterator.from([1, 2, 3])
        .reverse()
        .collect()
        .unwrap();
      expect(result).toEqual([3, 2, 1]);
    });

    it("should handle empty iterator", () => {
      const result = Iterator.from([])
        .reverse()
        .collect()
        .unwrap();
      expect(result).toEqual([]);
    });

    it("should handle double reverse", () => {
      const result = Iterator.from([1, 2, 3])
        .reverse()
        .reverse()
        .collect()
        .unwrap();
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe("filterMap operation", () => {
    it("should filter and map in one operation", () => {
      const result = Iterator.from(['1', 'a', '2', 'b'])
        .filterMap(x => {
          const num = parseInt(x);
          return isNaN(num) ? Option.none() : Option.some(num * 2);
        })
        .collect()
        .unwrap();
      expect(result).toEqual([2, 4]);
    });

    it("should handle all None values", () => {
      const result = Iterator.from([1, 2, 3])
        .filterMap(() => Option.none())
        .collect()
        .unwrap();
      expect(result).toEqual([]);
    });
  });

  describe("debug operation", () => {
    it("should not affect the iterator result", () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const result = Iterator.from([1, 2, 3])
        .debug("num: ")
        .collect()
        .unwrap();

      expect(result).toEqual([1, 2, 3]);
      expect(consoleSpy).toHaveBeenCalledTimes(3);
      expect(consoleSpy).toHaveBeenCalledWith("num: 1");
      expect(consoleSpy).toHaveBeenCalledWith("num: 2");
      expect(consoleSpy).toHaveBeenCalledWith("num: 3");

      consoleSpy.mockRestore();
    });
  });
});
