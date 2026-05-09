import { NextRequest, NextResponse } from 'next/server';

// Edge-runtime-safe JWT decode — reads payload without signature verification.
// Security is enforced by verifyRequestAuth() in every API route (Node.js runtime).
function decodeJwt(token: string): { role?: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // base64url → base64
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    const payload = JSON.parse(json);
    // Reject expired tokens
    if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const pathname = request.nextUrl.pathname;

  const adminPublicRoutes = ['/login', '/signup', '/reset-password', '/verify-email'];
  const clientPublicRoutes = ['/client/login'];

  const isAdminPublic = adminPublicRoutes.some((r) => pathname.startsWith(r));
  const isClientPublic = clientPublicRoutes.some((r) => pathname.startsWith(r));
  const isPublicRoute = isAdminPublic || isClientPublic;

  if (isPublicRoute) {
    if (token) {
      const payload = decodeJwt(token);
      if (payload) {
        if (isAdminPublic && payload.role === 'admin') {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
        if (isClientPublic && payload.role === 'client') {
          return NextResponse.redirect(new URL('/client/dashboard', request.url));
        }
      }
    }
    return NextResponse.next();
  }

  // Unauthenticated — send to appropriate login
  if (!token) {
    const loginUrl = pathname.startsWith('/client') ? '/client/login' : '/login';
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  const payload = decodeJwt(token);
  if (!payload) {
    const loginUrl = pathname.startsWith('/client') ? '/client/login' : '/login';
    const response = NextResponse.redirect(new URL(loginUrl, request.url));
    response.cookies.delete('token');
    return response;
  }

  // Role-based routing
  if (pathname.startsWith('/admin') && payload.role !== 'admin') {
    return NextResponse.redirect(new URL('/client/dashboard', request.url));
  }
  if (pathname.startsWith('/client') && payload.role !== 'client') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public|uploads|svg).*)'],
};
