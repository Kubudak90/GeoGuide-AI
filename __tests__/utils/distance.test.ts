import { describe, it, expect } from 'vitest';
import { calculateDistance, formatDistance } from '../../utils/distance';

describe('calculateDistance', () => {
  it('should return 0 for same point', () => {
    const d = calculateDistance(41.0082, 28.9784, 41.0082, 28.9784);
    expect(d).toBe(0);
  });

  it('should calculate distance between Istanbul and Ankara approximately', () => {
    // Istanbul: 41.0082, 28.9784 / Ankara: 39.9334, 32.8597
    const d = calculateDistance(41.0082, 28.9784, 39.9334, 32.8597);
    // ~350 km +-50 km
    expect(d).toBeGreaterThan(300_000);
    expect(d).toBeLessThan(400_000);
  });

  it('should return positive value regardless of order', () => {
    const d1 = calculateDistance(40, 29, 41, 30);
    const d2 = calculateDistance(41, 30, 40, 29);
    expect(Math.abs(d1 - d2)).toBeLessThan(1); // rounding tolerance
  });
});

describe('formatDistance', () => {
  it('should format meters for distances under 1km', () => {
    expect(formatDistance(500)).toBe('500 m');
    expect(formatDistance(50)).toBe('50 m');
  });

  it('should format km for distances over 1km', () => {
    expect(formatDistance(1500)).toBe('1.5 km');
    expect(formatDistance(10000)).toBe('10.0 km');
  });

  it('should round meters', () => {
    expect(formatDistance(123.7)).toBe('124 m');
  });
});
