import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import db from '@/lib/db';
import { invitations } from '@/lib/db/schema';
import { isInvitationUsable, normalizeInviteEmail } from './policy';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hashInviteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createInvitation(email: string, createdBy: string, baseUrl: string) {
  const token = randomBytes(32).toString('base64url');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + INVITE_TTL_MS);
  await db.insert(invitations).values({
    id: randomBytes(16).toString('hex'),
    email: normalizeInviteEmail(email),
    tokenHash: hashInviteToken(token),
    createdBy,
    expiresAt,
    createdAt: now,
  });
  return { url: `${baseUrl}/signup?invite=${encodeURIComponent(token)}`, expiresAt };
}

export async function listInvitations() {
  return db.select({
    id: invitations.id,
    email: invitations.email,
    expiresAt: invitations.expiresAt,
    usedAt: invitations.usedAt,
    revokedAt: invitations.revokedAt,
    createdAt: invitations.createdAt,
  }).from(invitations).orderBy(desc(invitations.createdAt));
}

export async function revokeInvitation(id: string) {
  await db.update(invitations).set({ revokedAt: new Date() }).where(and(eq(invitations.id, id), isNull(invitations.usedAt), isNull(invitations.revokedAt)));
}

export async function consumeInvitation(email: string, token: string): Promise<boolean> {
  const tokenHash = hashInviteToken(token);
  const candidate = await db.query.invitations.findFirst({ where: and(eq(invitations.tokenHash, tokenHash), eq(invitations.email, normalizeInviteEmail(email))) });
  if (!candidate || !isInvitationUsable(candidate)) return false;
  const claimed = await db.update(invitations).set({ usedAt: new Date() }).where(and(eq(invitations.id, candidate.id), isNull(invitations.usedAt), isNull(invitations.revokedAt), gt(invitations.expiresAt, new Date()))).returning({ id: invitations.id });
  return claimed.length === 1;
}
