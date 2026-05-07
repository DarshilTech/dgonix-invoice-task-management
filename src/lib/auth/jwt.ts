import jwt from 'jsonwebtoken';
import { getServerEnv } from '@/lib/config/env';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'client';
  tenantId?: string;
  companyIds?: string[];
  clientId?: string;
  companyId?: string;
}

export function signToken(payload: JWTPayload): string {
  const env = getServerEnv();
  return (jwt.sign as any)(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRY });
}

export function signRefreshToken(payload: JWTPayload): string {
  const env = getServerEnv();
  return (jwt.sign as any)(payload, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRY,
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const env = getServerEnv();
    return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const env = getServerEnv();
    return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
}
