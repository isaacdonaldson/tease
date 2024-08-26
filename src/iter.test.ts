import { Iterator, IterNegativeNumberError } from './iter';
import { Option } from './option';

describe('Iterator', () => {
  test('map', () => {
    const iter = new Iterator([1, 2, 3]);
    const mapped = iter.map(x => x * 2);
    expect(mapped.collect().unwrap()).toEqual([2, 4, 6]);
  });

  test('filter', () => {
    const iter = new Iterator([1, 2, 3, 4, 5]);
    const filtered = iter.filter(x => x % 2 === 0);
    expect(filtered.collect().unwrap()).toEqual([2, 4]);
  });

  test('fold', () => {
    const iter = new Iterator([1, 2, 3, 4, 5]);
    const sum = iter.fold((acc, x) => acc + x, 0);
    expect(sum).toBe(15);
  });

  test('collect', () => {
    const iter = new Iterator([1, 2, 3]);
    const result = iter.collect();
    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual([1, 2, 3]);
  });

  test('find', () => {
    const iter = new Iterator([1, 2, 3, 4, 5]);
    const found = iter.find(x => x > 3);
    expect(found.isSome()).toBe(true);
    expect(found.unwrap()).toBe(4);
  });

  test('position', () => {
    const iter = new Iterator(['a', 'b', 'c', 'd']);
    const pos = iter.position(x => x === 'c');
    expect(pos.isSome()).toBe(true);
    expect(pos.unwrap()).toBe(2);
  });

  test('reverse', () => {
    const iter = new Iterator([1, 2, 3]);
    const reversed = iter.reverse();
    expect(reversed.collect().unwrap()).toEqual([3, 2, 1]);
  });

  test('last', () => {
    const iter = new Iterator([1, 2, 3]);
    const last = iter.last();
    expect(last.isSome()).toBe(true);
    expect(last.unwrap()).toBe(3);
  });

  test('skip', () => {
    const iter = new Iterator([1, 2, 3, 4, 5]);
    const skipped = iter.skip(2);
    expect(skipped.collect().unwrap()).toEqual([3, 4, 5]);
  });

  test('skip with negative number', () => {
    const iter = new Iterator([1, 2, 3]);
    expect(() => iter.skip(-1)).toThrow(IterNegativeNumberError);
  });

  test('some', () => {
    const iter = new Iterator([1, 2, 3, 4, 5]);
    expect(iter.some(x => x > 3)).toBe(true);
    expect(iter.some(x => x > 10)).toBe(false);
  });

  test('all', () => {
    const iter = new Iterator([1, 2, 3, 4, 5]);
    expect(iter.all(x => x > 0)).toBe(true);
    expect(iter.all(x => x < 5)).toBe(false);
  });

  test('take', () => {
    const iter = new Iterator([1, 2, 3, 4, 5]);
    const taken = iter.take(3);
    expect(taken.collect().unwrap()).toEqual([1, 2, 3]);
  });

  test('take with negative number', () => {
    const iter = new Iterator([1, 2, 3]);
    expect(() => iter.take(-1)).toThrow(IterNegativeNumberError);
  });

  test('filterMap', () => {
    const iter = new Iterator([1, 2, 3, 4, 5]);
    const filtered = iter.filterMap(x => x % 2 === 0 ? Option.some(x * 10) : Option.none());
    expect(filtered.collect().unwrap()).toEqual([20, 40]);
  });

  test('tap', () => {
    const iter = new Iterator([1, 2, 3]);
    const sideEffect: number[] = [];
    const tapped = iter.tap(x => sideEffect.push(x));
    expect(tapped.collect().unwrap()).toEqual([1, 2, 3]);
    expect(sideEffect).toEqual([1, 2, 3]);
  });

  test('chunk', () => {
    const iter = new Iterator([1, 2, 3, 4, 5]);
    const chunked = iter.chunk(2);
    expect(chunked.collect().unwrap()).toEqual([[1, 2], [3, 4], [5]]);
  });

  test('chunk with invalid size', () => {
    const iter = new Iterator([1, 2, 3]);
    expect(() => iter.chunk(0)).toThrow(IterNegativeNumberError);
  });

  test('count', () => {
    const iter = new Iterator([1, 2, 3, 4, 5]);
    expect(iter.count()).toBe(5);
  });

  test('zip', () => {
    const iter1 = new Iterator([1, 2, 3]);
    const iter2 = new Iterator(['a', 'b', 'c']);
    const zipped = iter1.zip(iter2);
    expect(zipped.collect().unwrap()).toEqual([[1, 'a'], [2, 'b'], [3, 'c']]);
  });

  test('unzip', () => {
    const iter = new Iterator<[number, string]>([[1, 'a'], [2, 'b'], [3, 'c']]);
    const [numbers, letters] = iter.unzip();
    expect(numbers.collect().unwrap()).toEqual([1, 2, 3]);
    expect(letters.collect().unwrap()).toEqual(['a', 'b', 'c']);
  });

  test('nth', () => {
    const iter = new Iterator([1, 2, 3, 4, 5]);
    expect(iter.nth(2).unwrap()).toBe(3);
    expect(iter.nth(10).isNone()).toBe(true);
  });

  test('nth with negative index', () => {
    const iter = new Iterator([1, 2, 3]);
    expect(() => iter.nth(-1)).toThrow(IterNegativeNumberError);
  });

  test('groupBy', () => {
    const iter = new Iterator([1, 2, 3, 4, 5]);
    const grouped = iter.groupBy(x => x % 2);
    expect(grouped.get(0)).toEqual([2, 4]);
    expect(grouped.get(1)).toEqual([1, 3, 5]);
  });

  test('sortBy', () => {
    const iter = new Iterator([3, 1, 4, 1, 5, 9, 2, 6]);
    const sorted = iter.sortBy(x => x);
    expect(sorted.collect().unwrap()).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
  });

  test('collect with error', () => {
    const iter = new Iterator({
      [Symbol.iterator]: () => ({
        next: () => { throw new Error('Test error'); }
      })
    });
    const result = iter.collect();
    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(Error);
  });

  test('find with no match', () => {
    const iter = new Iterator([1, 2, 3]);
    const found = iter.find(x => x > 5);
    expect(found.isNone()).toBe(true);
  });

  test('position with no match', () => {
    const iter = new Iterator([1, 2, 3]);
    const pos = iter.position(x => x > 5);
    expect(pos.isNone()).toBe(true);
  });

  test('last on empty iterator', () => {
    const iter = new Iterator([]);
    const last = iter.last();
    expect(last.isNone()).toBe(true);
  });

  test('chunk with size larger than iterator', () => {
    const iter = new Iterator([1, 2]);
    const chunked = iter.chunk(5);
    expect(chunked.collect().unwrap()).toEqual([[1, 2]]);
  });

  test('nth out of bounds', () => {
    const iter = new Iterator([1, 2, 3]);
    expect(iter.nth(5).isNone()).toBe(true);
  });

  test('zip with unequal length iterators', () => {
    const iter1 = new Iterator([1, 2, 3]);
    const iter2 = new Iterator(['a', 'b']);
    const zipped = iter1.zip(iter2);
    expect(zipped.collect().unwrap()).toEqual([[1, 'a'], [2, 'b']]);
  });

  test('unzip with empty iterator', () => {
    const iter = new Iterator<[number, string]>([]);
    const [numbers, letters] = iter.unzip();
    expect(numbers.collect().unwrap()).toEqual([]);
    expect(letters.collect().unwrap()).toEqual([]);
  });
});
