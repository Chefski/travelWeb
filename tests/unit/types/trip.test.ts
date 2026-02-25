import { describe, it, expect } from 'vitest';
import { DAY_COLORS } from '~/types/trip';

describe('DAY_COLORS', () => {
  it('has 10 entries', () => {
    expect(DAY_COLORS).toHaveLength(10);
  });

  it('each is a valid hex color string', () => {
    for (const c of DAY_COLORS) {
      expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
