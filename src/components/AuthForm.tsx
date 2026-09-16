'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '@/lib/auth-client';

export default function AuthForm({ mode, inviteToken = '' }: { mode: 'login' | 'signup'; inviteToken?: string }) {
  const router = useRouter(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [name, setName] = useState(''); const [error, setError] = useState(''); const [pending, setPending] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setPending(true); setError('');
    const result = mode === 'login' ? await signIn.email({ email, password }) : await signUp.email({ email, password, name: name || email.split('@')[0], inviteToken } as Parameters<typeof signUp.email>[0]);
    setPending(false); if (result.error) { setError('Unable to authenticate with those details.'); return; } router.push('/'); router.refresh();
  }
  return <main className="min-h-screen flex items-center justify-center bg-light-primary dark:bg-dark-primary p-6"><form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl bg-light-secondary dark:bg-dark-secondary p-8 shadow"><h1 className="text-2xl font-semibold">{mode === 'login' ? 'Log in to Vane' : 'Create your Vane account'}</h1>{mode === 'signup' && <input required value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="w-full rounded border p-3 text-black" /> }<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full rounded border p-3 text-black" /><input required minLength={8} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full rounded border p-3 text-black" />{error && <p role="alert" className="text-red-500">{error}</p>}<button disabled={pending} className="w-full rounded bg-blue-600 p-3 text-white disabled:opacity-50">{pending ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}</button><p className="text-sm">{mode === 'login' ? <>New to Vane? <Link className="underline" href="/signup">Create an account</Link></> : <>Already registered? <Link className="underline" href="/login">Log in</Link></>}</p></form></main>;
}
