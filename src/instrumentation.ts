export const register = async () => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { getAuthConfig, getDatabaseUrl } = await import('./lib/env');
      getDatabaseUrl();
      getAuthConfig();
      const { migrate } = await import('./lib/db/migrate');
      await migrate();
      console.log('Database migrations completed successfully');
    } catch (error) {
      console.error('Failed to run database migrations:', error instanceof Error ? error.message : 'unknown database error');
      throw error;
    }
    await import('./lib/config/index');
  }
};
