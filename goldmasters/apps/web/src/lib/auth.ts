import { NextRequest } from 'next/server';
import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface JWTPayload {
  sub?: string;
  userId?: string;
  username?: string;
  role?: string;
  type?: string;
  competitionId?: string;
  participantId?: string;
  phone?: string;
  participantIds?: string[];
}

export interface AuthUser {
  id: string;
  username?: string;
  role: string;
  type: string;
}

export interface CompetitionAccess {
  competitionId: string;
  type: string;
}

export interface ParticipantAccess {
  competitionId: string;
  participantId: string;
  type: string;
}

/**
 * Verify JWT token and return decoded payload
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256']
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Authenticate admin user from request
 */
export function authenticateAdmin(request: NextRequest): AuthUser | null {
  const token = extractToken(request);
  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'ADMIN') {
    return null;
  }

  return {
    id: decoded.sub || 'admin',
    username: decoded.username,
    role: decoded.role,
    type: decoded.type || 'admin_token',
  };
}

/**
 * Verify competition access token
 */
export function verifyCompetitionAccess(
  request: NextRequest,
  competitionId: string
): CompetitionAccess | null {
  const resolveCompetitionId = (id: string) => {
    const defaultCompetitionId = process.env.NEXT_PUBLIC_DEFAULT_COMPETITION_ID?.trim() || 'test-id';
    if (!id) {
      return defaultCompetitionId;
    }
    if (id.startsWith('user-') || id.startsWith('participant-')) {
      return defaultCompetitionId;
    }
    return id;
  };

  const token = extractToken(request);
  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded || decoded.type !== 'competition_access') {
    return null;
  }

  const expectedCompetitionId = resolveCompetitionId(competitionId);

  if (decoded.competitionId !== expectedCompetitionId) {
    return null;
  }

  return {
    competitionId: expectedCompetitionId,
    type: decoded.type,
  };
}

/**
 * Verify participant access token
 */
export function verifyParticipantAccess(
  request: NextRequest,
  competitionId: string
): ParticipantAccess | null {
  const resolveCompetitionId = (id: string) => {
    const defaultCompetitionId = process.env.NEXT_PUBLIC_DEFAULT_COMPETITION_ID?.trim() || 'test-id';
    if (!id) {
      return defaultCompetitionId;
    }
    if (id.startsWith('user-') || id.startsWith('participant-')) {
      return defaultCompetitionId;
    }
    return id;
  };

  const token = extractToken(request);
  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded || decoded.type !== 'participant_access') {
    return null;
  }

  const expectedCompetitionId = resolveCompetitionId(competitionId);

  if (decoded.competitionId !== expectedCompetitionId) {
    return null;
  }

  return {
    competitionId: expectedCompetitionId,
    participantId: decoded.participantId || '',
    type: decoded.type,
  };
}

/**
 * Generate JWT token
 */
export function generateToken(payload: Record<string, any>, expiresIn?: string): string {
  return jwt.sign(payload, JWT_SECRET, {
    ...(expiresIn && { expiresIn }),
    ...(!expiresIn && { expiresIn: '12h' })
  } as SignOptions);
}
