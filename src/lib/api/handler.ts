import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema } from 'zod';

export interface ApiContext {
  userId: string;
  email: string;
  role: 'admin' | 'client';
  companyIds?: string[];
  companyId?: string;
  clientId?: string;
}

export function getApiContext(request: NextRequest): ApiContext {
  return {
    userId: request.headers.get('x-user-id') || '',
    email: request.headers.get('x-user-email') || '',
    role: (request.headers.get('x-user-role') as 'admin' | 'client') || 'client',
    companyIds: request.headers.get('x-company-ids')
      ? JSON.parse(request.headers.get('x-company-ids')!)
      : undefined,
    companyId: request.headers.get('x-company-id') || undefined,
    clientId: request.headers.get('x-client-id') || undefined,
  };
}

export async function validateRequest<T>(
  request: NextRequest,
  schema: ZodSchema
): Promise<{ valid: true; data: T } | { valid: false; error: string }> {
  try {
    const body = await request.json();
    const validation = schema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      return {
        valid: false,
        error: errors.join(', '),
      };
    }

    return {
      valid: true,
      data: validation.data as T,
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid JSON body',
    };
  }
}

export function apiResponse<T>(
  data: T,
  status: number = 200
): NextResponse<{ success: boolean; data: T }> {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(
  error: string | Error,
  status: number = 400
): NextResponse<{ success: boolean; error: string }> {
  const message = error instanceof Error ? error.message : error;
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function apiHandler<T>(
  handler: (request: NextRequest, context: ApiContext) => Promise<T | NextResponse>,
  options?: {
    requireAuth?: boolean;
    requireRole?: ('admin' | 'client')[];
  }
): Promise<(request: NextRequest) => Promise<NextResponse>> {
  return async (request: NextRequest) => {
    try {
      if (options?.requireAuth) {
        const userId = request.headers.get('x-user-id');
        const role = request.headers.get('x-user-role');

        if (!userId || !role) {
          return apiError('Unauthorized', 401);
        }

        if (options?.requireRole && !options.requireRole.includes(role as 'admin' | 'client')) {
          return apiError('Forbidden', 403);
        }
      }

      const context = getApiContext(request);
      const result = await handler(request, context);

      if (result instanceof NextResponse) {
        return result;
      }

      return apiResponse(result);
    } catch (error) {
      console.error('API Handler Error:', error);
      return apiError(error instanceof Error ? error.message : 'Internal server error', 500);
    }
  };
}
