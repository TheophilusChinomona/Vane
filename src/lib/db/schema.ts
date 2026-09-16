import { sql } from 'drizzle-orm';
import { boolean, index, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { Block } from '../types';
import { SearchSources } from '../agents/search/types';

export const user = pgTable('user', {
  id: text('id').primaryKey(), name: text('name').notNull(), email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false), image: text('image'),
  createdAt: timestamp('created_at').notNull(), updatedAt: timestamp('updated_at').notNull(),
  role: text('role').notNull().default('user'),
});
export const session = pgTable('session', {
  id: text('id').primaryKey(), expiresAt: timestamp('expires_at').notNull(), token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(), updatedAt: timestamp('updated_at').notNull(), ipAddress: text('ip_address'),
  userAgent: text('user_agent'), userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
}, (t) => [index('session_user_id_idx').on(t.userId)]);
export const account = pgTable('account', {
  id: text('id').primaryKey(), accountId: text('account_id').notNull(), providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }), accessToken: text('access_token'),
  refreshToken: text('refresh_token'), idToken: text('id_token'), accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'), scope: text('scope'), password: text('password'),
  createdAt: timestamp('created_at').notNull(), updatedAt: timestamp('updated_at').notNull(),
}, (t) => [index('account_user_id_idx').on(t.userId)]);
export const verification = pgTable('verification', {
  id: text('id').primaryKey(), identifier: text('identifier').notNull(), value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(), createdAt: timestamp('created_at'), updatedAt: timestamp('updated_at'),
}, (t) => [index('verification_identifier_idx').on(t.identifier)]);

export interface DBFile { name: string; fileId: string; }
export const chats = pgTable('chats', {
  id: text('id').primaryKey(), userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(), createdAt: text('createdAt').notNull(),
  sources: jsonb('sources').$type<SearchSources[]>().notNull().default(sql`'[]'::jsonb`),
  files: jsonb('files').$type<DBFile[]>().notNull().default(sql`'[]'::jsonb`),
}, (t) => [index('chats_user_id_idx').on(t.userId)]);
export const messages = pgTable('messages', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(), messageId: text('messageId').notNull(), chatId: text('chatId').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  backendId: text('backendId').notNull(), query: text('query').notNull(), createdAt: text('createdAt').notNull(),
  responseBlocks: jsonb('responseBlocks').$type<Block[]>().notNull().default(sql`'[]'::jsonb`), status: text('status', { enum: ['answering', 'completed', 'error'] }).notNull().default('answering'),
}, (t) => [index('messages_chat_id_idx').on(t.chatId)]);

export const invitations = pgTable('invitations', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  createdBy: text('created_by').notNull().references(() => user.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').notNull(),
}, (t) => [index('invitations_email_idx').on(t.email)]);

export const authSchema = { user, session, account, verification };
export const schema = { ...authSchema, chats, messages, invitations };
