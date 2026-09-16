import { requireAdmin } from '@/lib/auth-session';
import { createInvitation, listInvitations, revokeInvitation } from '@/lib/invitations/service';

export async function GET() {
  const user = await requireAdmin();
  if (user instanceof Response) return user;
  return Response.json({ invitations: await listInvitations() });
}

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (user instanceof Response) return user;
  const body = await request.json().catch(() => ({}));
  if (typeof body.email !== 'string' || !body.email.trim()) {
    return Response.json({ message: 'Email is required' }, { status: 400 });
  }
  const baseUrl = process.env.BETTER_AUTH_URL || new URL(request.url).origin;
  const invitation = await createInvitation(body.email, user.id, baseUrl);
  return Response.json(invitation, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await requireAdmin();
  if (user instanceof Response) return user;
  const body = await request.json().catch(() => ({}));
  if (typeof body.id !== 'string' || !body.id) {
    return Response.json({ message: 'Invitation id is required' }, { status: 400 });
  }
  await revokeInvitation(body.id);
  return Response.json({ message: 'Invitation revoked' });
}
