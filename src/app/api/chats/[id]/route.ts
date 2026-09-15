import db from '@/lib/db';
import { chats, messages } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { getSession, unauthorizedResponse } from '@/lib/auth-session';

async function ownedChat(id: string, userId: string) { return db.query.chats.findFirst({ where: and(eq(chats.id, id), eq(chats.userId, userId)) }); }
export const GET = async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const session = await getSession(); if (!session) return unauthorizedResponse();
  try { const { id } = await params; const chat = await ownedChat(id, session.user.id); if (!chat) return Response.json({ message: 'Chat not found' }, { status: 404 }); const chatMessages = await db.query.messages.findMany({ where: eq(messages.chatId, id) }); return Response.json({ chat, messages: chatMessages }, { status: 200 }); }
  catch (err) { console.error('Error in getting chat by id: ', err); return Response.json({ message: 'An error has occurred.' }, { status: 500 }); }
};
export const DELETE = async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const session = await getSession(); if (!session) return unauthorizedResponse();
  try { const { id } = await params; const chat = await ownedChat(id, session.user.id); if (!chat) return Response.json({ message: 'Chat not found' }, { status: 404 }); await db.delete(chats).where(and(eq(chats.id, id), eq(chats.userId, session.user.id))); return Response.json({ message: 'Chat deleted successfully' }, { status: 200 }); }
  catch (err) { console.error('Error in deleting chat by id: ', err); return Response.json({ message: 'An error has occurred.' }, { status: 500 }); }
};
