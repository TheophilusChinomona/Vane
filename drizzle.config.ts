import { getDatabaseUrl } from './src/lib/env';
export default { dialect: 'postgresql', schema: './src/lib/db/schema.ts', out: './drizzle', dbCredentials: { url: getDatabaseUrl() } };
