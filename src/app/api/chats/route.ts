import db from '@/lib/db';
import { chats } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { getSession, unauthorizedResponse } from '@/lib/auth-session';

export const GET = async () => {
  const session = await getSession();
  if (!session) return unauthorizedResponse();
  try {
    const rows = await db.select().from(chats).where(eq(chats.userId, session.user.id)).orderBy(desc(chats.createdAt));
    return Response.json({ chats: rows }, { status: 200 });
  } catch (err) { console.error('Error in getting chats: ', err); return Response.json({ message: 'An error has occurred.' }, { status: 500 }); }
};
