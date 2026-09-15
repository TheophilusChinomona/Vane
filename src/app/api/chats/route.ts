import db from '@/lib/db';
import { chats } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { requireApiUser } from '@/lib/auth-session';

export const GET = async () => {
  const authenticatedUser = await requireApiUser();
  if (authenticatedUser instanceof Response) return authenticatedUser;
  try {
    const rows = await db.select().from(chats).where(eq(chats.userId, authenticatedUser.id)).orderBy(desc(chats.createdAt));
    return Response.json({ chats: rows }, { status: 200 });
  } catch (err) { console.error('Error in getting chats: ', err); return Response.json({ message: 'An error has occurred.' }, { status: 500 }); }
};
