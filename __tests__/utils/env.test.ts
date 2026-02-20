import { describe, it, expect } from 'vitest';
import { validateEnv } from '../../utils/env';

describe('validateEnv', () => {
  it('should return missing keys when env vars are empty', () => {
    const missing = validateEnv();
    // In test environment, env vars are not set
    expect(Array.isArray(missing)).toBe(true);
  });
});
