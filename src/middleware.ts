import { NextResponse, type NextRequest } from 'next/server';

const publicPaths = ['/login', '/signup'];
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/api/auth/') || publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();
  const hasSessionCookie = request.cookies.has('better-auth.session_token') || request.cookies.has('__Secure-better-auth.session_token');
  if (pathname.startsWith('/api/')) {
    return hasSessionCookie ? NextResponse.next() : NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }
  if (!hasSessionCookie) return NextResponse.redirect(new URL('/login', request.url));
  return NextResponse.next();
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest).*)'] };
