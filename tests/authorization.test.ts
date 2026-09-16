import { describe, expect, it } from 'vitest';
import { unauthorizedResponse } from '../src/lib/auth-response';
import { ownsResource } from '../src/lib/authorization';
import { isAdminRole, shouldPromoteFirstUser } from '../src/lib/auth-role-policy';

describe('authorization boundaries', () => {
  it('returns 401 for an anonymous API request', async () => {
    const response = unauthorizedResponse();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: 'Authentication required' });
  });

  it('denies cross-user resources while allowing the owner', () => {
    expect(ownsResource('user-a', 'user-a')).toBe(true);
    expect(ownsResource('user-b', 'user-a')).toBe(false);
  });
});

describe('first-admin policy', () => {
  it('promotes only when no admin exists', () => {
    expect(shouldPromoteFirstUser(0)).toBe(true);
    expect(shouldPromoteFirstUser(1)).toBe(false);
    expect(shouldPromoteFirstUser(2)).toBe(false);
  });
});

describe('instance configuration policy', () => {
  it('allows only the admin role to manage instance configuration', () => {
    expect(isAdminRole('admin')).toBe(true);
    expect(isAdminRole('user')).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });
});
