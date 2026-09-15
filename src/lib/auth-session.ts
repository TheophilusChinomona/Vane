import { headers } from 'next/headers';
import { auth, type AuthSession } from './auth';
import { unauthorizedResponse } from './auth-response';
export { unauthorizedResponse } from './auth-response';

export async function getSession(): Promise<AuthSession | null> {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireUser(): Promise<NonNullable<AuthSession>['user']> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session.user;
}

export class UnauthorizedError extends Error {
  constructor() { super('Authentication required'); this.name = 'UnauthorizedError'; }
}

export async function requireApiUser(): Promise<NonNullable<AuthSession>['user'] | Response> {
  const session = await getSession();
  return session ? session.user : unauthorizedResponse();
}
