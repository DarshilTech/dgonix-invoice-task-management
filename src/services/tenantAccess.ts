import type { JWTPayload } from '@/lib/auth/jwt';

export function getAccessibleTenantIds(payload: JWTPayload): string[] {
  const tenantIds = [payload.tenantId, payload.companyId, ...(payload.companyIds || [])].filter(
    (tenantId): tenantId is string => Boolean(tenantId)
  );

  return Array.from(new Set(tenantIds));
}

export function getPrimaryTenantId(payload: JWTPayload): string {
  const [tenantId] = getAccessibleTenantIds(payload);
  if (!tenantId) {
    throw new Error('No tenant is attached to this user session');
  }

  return tenantId;
}

export function canAccessTenant(payload: JWTPayload, tenantId: string): boolean {
  return getAccessibleTenantIds(payload).includes(tenantId);
}

export function requireTenantAccess(payload: JWTPayload, tenantId: string) {
  if (!canAccessTenant(payload, tenantId)) {
    throw new Error('Forbidden');
  }
}

export function tenantScopedQuery(payload: JWTPayload, requestedTenantId?: string) {
  if (requestedTenantId) {
    requireTenantAccess(payload, requestedTenantId);
    return { tenantId: requestedTenantId };
  }

  if (payload.role === 'admin') {
    return { tenantId: { $in: getAccessibleTenantIds(payload) } };
  }

  return { tenantId: getPrimaryTenantId(payload), clientId: payload.clientId };
}
