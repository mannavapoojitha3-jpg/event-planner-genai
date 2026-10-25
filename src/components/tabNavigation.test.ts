import { describe, expect, it } from 'vitest';
import { nextTabIndex } from './tabNavigation';

describe('nextTabIndex', () => {
  it('moves right and left by one tab', () => {
    expect(nextTabIndex('ArrowRight', 1, 4)).toBe(2);
    expect(nextTabIndex('ArrowLeft', 2, 4)).toBe(1);
  });

  it('wraps from the last tab to the first and from the first to the last', () => {
    expect(nextTabIndex('ArrowRight', 3, 4)).toBe(0);
    expect(nextTabIndex('ArrowLeft', 0, 4)).toBe(3);
  });

  it('jumps to the first and last tab with Home and End', () => {
    expect(nextTabIndex('Home', 2, 4)).toBe(0);
    expect(nextTabIndex('End', 1, 4)).toBe(3);
  });

  it('returns null for keys that are not tab navigation', () => {
    expect(nextTabIndex('Enter', 1, 4)).toBeNull();
    expect(nextTabIndex('a', 1, 4)).toBeNull();
  });

  it('returns null when there are no tabs', () => {
    expect(nextTabIndex('ArrowRight', 0, 0)).toBeNull();
  });
});
