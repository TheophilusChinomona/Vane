const required = (name: 'DATABASE_URL' | 'BETTER_AUTH_SECRET' | 'BETTER_AUTH_URL') => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
};

export const getDatabaseUrl = () => {
  const value = required('DATABASE_URL');
  try {
    const url = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error();
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL');
  }
  return value;
};

export const getAuthConfig = () => ({
  secret: required('BETTER_AUTH_SECRET'),
  url: (() => {
    const value = required('BETTER_AUTH_URL');
    try { return new URL(value).toString().replace(/\/$/, ''); }
    catch { throw new Error('BETTER_AUTH_URL must be a valid URL'); }
  })(),
});
