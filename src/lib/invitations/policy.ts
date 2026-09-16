export type InvitationState = {
  usedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date;
};

export function normalizeInviteEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isInvitationUsable(invitation: InvitationState, now = new Date()): boolean {
  return invitation.usedAt === null && invitation.revokedAt === null && invitation.expiresAt > now;
}
