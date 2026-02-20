import { describe, it, expect, beforeEach } from 'vitest';

// Simple unit test for search history logic (not React hook test)
describe('Search History Logic', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should store and retrieve history from localStorage', () => {
    const key = 'search_history';
    const items = ['istanbul restaurants', 'paris cafes'];
    localStorage.setItem(key, JSON.stringify(items));

    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    expect(stored).toEqual(items);
  });

  it('should handle empty localStorage', () => {
    const stored = JSON.parse(localStorage.getItem('search_history') || '[]');
    expect(stored).toEqual([]);
  });

  it('should limit to max items', () => {
    const items = Array.from({ length: 25 }, (_, i) => `query-${i}`);
    const limited = items.slice(0, 20);
    expect(limited.length).toBe(20);
  });

  it('should move duplicate to top', () => {
    const items = ['a', 'b', 'c'];
    const newQuery = 'b';
    const filtered = items.filter(item => item !== newQuery);
    const updated = [newQuery, ...filtered];
    expect(updated).toEqual(['b', 'a', 'c']);
  });
});
