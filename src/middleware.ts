import { NextResponse, type NextRequest } from 'next/server';

const publicPaths = ['/login', '/signup'];
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/api/auth/') || publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();
  // API handlers perform the authoritative server-side session check. Middleware
  // must not treat a client-controlled cookie as proof of authentication.
  if (pathname.startsWith('/api/')) return NextResponse.next();
  const hasSessionCookie = request.cookies.has('better-auth.session_token') || request.cookies.has('__Secure-better-auth.session_token');
  if (!hasSessionCookie) return NextResponse.redirect(new URL('/login', request.url));
  return NextResponse.next();
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest).*)'] };
