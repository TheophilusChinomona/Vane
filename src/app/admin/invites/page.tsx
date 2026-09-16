import InviteManager from './InviteManager';
import { getSession } from '@/lib/auth-session';

export default async function InvitationsPage() {
  const session = await getSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== 'admin') {
    return <main className="min-h-screen p-8 text-black dark:text-white">Administrator access required.</main>;
  }
  return <InviteManager />;
}
