import { NextRequest, NextResponse } from 'next/server';
import { TokenExpiredError } from 'jsonwebtoken';
import { extractBearerToken, verifyToken } from './jwt';
import { fail } from '../http';

const resolveCompetitionId = (competitionId: string): string => {
  const defaultCompetitionId = process.env.NEXT_PUBLIC_DEFAULT_COMPETITION_ID?.trim() || 'test-id';

  if (!competitionId) {
    return defaultCompetitionId;
  }

  if (competitionId.startsWith('user-') || competitionId.startsWith('participant-')) {
    return defaultCompetitionId;
  }

  return competitionId;
};

export type ParticipantAccessPayload = {
  competitionId: string;
  participantId: string;
  type: string;
};

export const requireParticipantToken = (
  req: NextRequest,
  competitionId: string
): ParticipantAccessPayload | NextResponse => {
  const authorization = req.headers.get('authorization');
  const token = extractBearerToken(authorization);

  if (!token) {
    return fail('Participant access token required', 401);
  }

  try {
    const payload = verifyToken<ParticipantAccessPayload>(token);

    if (payload.type !== 'participant_access') {
      return fail('Invalid token type', 403);
    }

    const expectedCompetitionId = resolveCompetitionId(competitionId);

    if (payload.competitionId !== expectedCompetitionId) {
      return fail('Token not valid for this competition', 403);
    }

    return {
      ...payload,
      competitionId: expectedCompetitionId,
    };
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return fail('Participant session expired. Please verify your details again.', 401);
    }

    return fail('Invalid or expired participant token', 403);
  }
};
