import { describe, it, expect } from 'vitest';
import { injectAds } from '../array-inject';

describe('injectAds', () => {
  it('should inject ad markers at specified intervals', () => {
    const items = [1, 2, 3, 4, 5];
    const result = injectAds(items, 2);
    expect(result).toEqual([1, 2, { isAd: true }, 3, 4, { isAd: true }, 5]);
  });
});
