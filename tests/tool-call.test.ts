import { describe, expect, it } from 'vitest';
import { parseToolCallArguments } from '../src/lib/models/providers/openai/tool-call-arguments';

describe('streaming tool-call arguments', () => {
  it('treats an empty argument fragment as an empty object', () => {
    expect(parseToolCallArguments('')).toEqual({});
    expect(parseToolCallArguments('{"query":"eve.dev"}')).toEqual({ query: 'eve.dev' });
  });
});
