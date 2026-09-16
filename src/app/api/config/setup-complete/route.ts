import { requireAdmin } from '@/lib/auth-session';
import configManager from '@/lib/config';
import { NextRequest } from 'next/server';

export const POST = async (req: NextRequest) => {
  const authenticatedUser = await requireAdmin();
  if (authenticatedUser instanceof Response) return authenticatedUser;
  try {
    configManager.markSetupComplete();

    return Response.json(
      {
        message: 'Setup marked as complete.',
      },
      {
        status: 200,
      },
    );
  } catch (err) {
    console.error('Error marking setup as complete: ', err);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};
