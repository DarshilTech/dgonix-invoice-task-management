import { NextRequest, NextResponse } from 'next/server';
import type { NextMiddleware } from 'next/server';
import { verifyToken, JWTPayload } from './jwt';

export function getTokenFromRequest(request: NextRequest): string | null {
  // Check HTTP-only cookie first (most secure)
  const cookieToken = request.cookies.get('token')?.value;
  if (cookieToken) return cookieToken;

  // Fallback to Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
}

export function verifyRequestAuth(request: NextRequest): {
  isValid: boolean;
  payload: JWTPayload | null;
  error?: string;
} {
  const token = getTokenFromRequest(request);

  if (!token) {
    return {
      isValid: false,
      payload: null,
      error: 'No token provided',
    };
  }

  const payload = verifyToken(token);

  if (!payload) {
    return {
      isValid: false,
      payload: null,
      error: 'Invalid token',
    };
  }

  return {
    isValid: true,
    payload,
  };
}

export function requireAuth(roles?: ('admin' | 'client')[]): NextMiddleware {
  return (request: NextRequest) => {
    const { isValid, payload, error } = verifyRequestAuth(request);

    if (!isValid || !payload) {
      return NextResponse.json({ success: false, error: error || 'Unauthorized' }, { status: 401 });
    }

    if (roles && !roles.includes(payload.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Add user info to request headers (accessible in route handlers)
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-role', payload.role);
    requestHeaders.set('x-user-email', payload.email);
    if (payload.tenantId) requestHeaders.set('x-tenant-id', payload.tenantId);
    if (payload.companyIds) {
      requestHeaders.set('x-company-ids', JSON.stringify(payload.companyIds));
    }
    if (payload.clientId) {
      requestHeaders.set('x-client-id', payload.clientId);
    }
    if (payload.companyId) {
      requestHeaders.set('x-company-id', payload.companyId);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  };
}

export function extractUserFromRequest(request: NextRequest): JWTPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}
