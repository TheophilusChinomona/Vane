import { parse } from 'partial-json';

export function parseToolCallArguments(raw: string): Record<string, unknown> {
  return parse(raw || '{}') as Record<string, unknown>;
}
