'use client';

import { useEffect, useState } from 'react';

type Invitation = {
  id: string;
  email: string;
  expiresAt: string;
  usedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export default function InviteManager() {
  const [email, setEmail] = useState('');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteUrl, setInviteUrl] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function loadInvitations() {
    const response = await fetch('/api/invitations');
    if (!response.ok) throw new Error('Unable to load invitations');
    setInvitations((await response.json()).invitations);
  }

  useEffect(() => { loadInvitations().catch((err) => setError(err.message)); }, []);

  async function createInvite(event: React.FormEvent) {
    event.preventDefault();
    setPending(true); setError(''); setInviteUrl('');
    try {
      const response = await fetch('/api/invitations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to create invitation');
      setInviteUrl(data.url); setEmail(''); await loadInvitations();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to create invitation'); }
    finally { setPending(false); }
  }

  async function revoke(id: string) {
    setError('');
    const response = await fetch('/api/invitations', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (!response.ok) { setError('Unable to revoke invitation'); return; }
    await loadInvitations();
  }

  return <main className="min-h-screen bg-light-primary dark:bg-dark-primary p-6 text-black dark:text-white"><div className="mx-auto max-w-3xl space-y-6"><div><h1 className="text-2xl font-semibold">Invitations</h1><p className="text-sm text-black/60 dark:text-white/60">Create single-use links for people you want to add to Vane.</p></div><form onSubmit={createInvite} className="flex gap-3"><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="person@example.com" className="flex-1 rounded border p-3 text-black" /><button disabled={pending} className="rounded bg-blue-600 px-5 py-3 text-white disabled:opacity-50">{pending ? 'Creating…' : 'Create invite'}</button></form>{inviteUrl && <div className="space-y-2 rounded border border-green-500/40 p-4"><p className="text-sm">Copy this link and send it privately. It expires in 7 days and can be used once.</p><input readOnly value={inviteUrl} onFocus={(event) => event.currentTarget.select()} className="w-full rounded border p-3 text-black" /></div>}{error && <p role="alert" className="text-red-500">{error}</p>}<div className="space-y-3">{invitations.map((invite) => <div key={invite.id} className="flex items-center justify-between rounded border border-light-200 dark:border-dark-200 p-4"><div><p className="font-medium">{invite.email}</p><p className="text-xs text-black/60 dark:text-white/60">Expires {new Date(invite.expiresAt).toLocaleString()} · {invite.usedAt ? 'Used' : invite.revokedAt ? 'Revoked' : 'Pending'}</p></div>{!invite.usedAt && !invite.revokedAt && <button onClick={() => revoke(invite.id)} className="text-sm text-red-500">Revoke</button>}</div>)}</div></div></main>;
}
