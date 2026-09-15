import { describe, expect, it, afterEach } from 'vitest';
import { getDatabaseUrl, getAuthConfig } from '../src/lib/env';

afterEach(() => { delete process.env.DATABASE_URL; delete process.env.BETTER_AUTH_SECRET; delete process.env.BETTER_AUTH_URL; });

describe('deployment configuration', () => {
  it('rejects missing database configuration without exposing values', () => {
    expect(() => getDatabaseUrl()).toThrow('DATABASE_URL is required');
  });
  it('accepts PostgreSQL URLs and rejects other protocols', () => {
    process.env.DATABASE_URL = 'postgresql://example.invalid/vane';
    expect(getDatabaseUrl()).toBe(process.env.DATABASE_URL);
    process.env.DATABASE_URL = 'sqlite:///tmp/vane.db';
    expect(() => getDatabaseUrl()).toThrow('valid PostgreSQL');
  });
  it('requires auth secret and canonical URL', () => {
    process.env.BETTER_AUTH_SECRET = 'test-only-secret'; process.env.BETTER_AUTH_URL = 'https://vane.example.test/';
    expect(getAuthConfig().url).toBe('https://vane.example.test');
  });
});
