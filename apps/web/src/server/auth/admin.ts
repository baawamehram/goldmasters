import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken, verifyToken } from './jwt';
import { fail } from '../http';

export type AdminTokenPayload = {
  sub: string;
  username: string;
  role: string;
  type: string;
};

export const requireAdminToken = (
  req: NextRequest
): AdminTokenPayload | NextResponse => {
  const authorization = req.headers.get('authorization');
  const token = extractBearerToken(authorization);

  if (!token) {
    return fail('Access token required', 401);
  }

  try {
    const payload = verifyToken<AdminTokenPayload>(token);

    if (payload.type !== 'admin_token' || payload.role !== 'ADMIN') {
      return fail('Admin access required', 403);
    }

    return payload;
  } catch (caughtError) {
    console.warn('Admin token verification failed', caughtError);
    return fail('Invalid or expired token', 403);
  }
};
