import type { JWTPayload } from '@/lib/auth/jwt';

/**
 * Returns the list of tenant IDs this user can access.
 * For admin users whose JWT pre-dates the new onboarding flow
 * (no tenantId/companyId set yet), falls back to userId — because
 * in the current architecture tenantId === userId for admins.
 */
export function getAccessibleTenantIds(payload: JWTPayload): string[] {
  const tenantIds = [
    payload.tenantId,
    payload.companyId,
    ...(payload.companyIds || []),
  ].filter((id): id is string => Boolean(id));

  const unique = Array.from(new Set(tenantIds));

  // Admin users always own their own tenant (userId == tenantId).
  // This covers stale JWTs that were issued before onboarding set tenantId.
  if (unique.length === 0 && payload.role === 'admin' && payload.userId) {
    return [payload.userId];
  }

  return unique;
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
