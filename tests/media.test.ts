import { describe, expect, it } from 'vitest';
import { selectImageSearchQuery } from '../src/lib/agents/media/image-query';

describe('image search query fallback', () => {
  it('uses the model query when valid and the original query otherwise', () => {
    expect(selectImageSearchQuery('cats in winter', 'show me cats')).toBe('cats in winter');
    expect(selectImageSearchQuery('', 'show me cats')).toBe('show me cats');
    expect(selectImageSearchQuery(undefined, 'show me cats')).toBe('show me cats');
  });
});
