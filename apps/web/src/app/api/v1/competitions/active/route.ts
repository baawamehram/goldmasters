import { NextRequest } from 'next/server';
import { getCompetitionsWithStats } from '@/server/data/mockDb';
import { error, fail } from '@/server/http';
import { extractBearerToken, verifyToken } from '@/server/auth/jwt';

export async function GET(req: NextRequest) {
  try {
    const authorization = req.headers.get('authorization');
    const token = extractBearerToken(authorization);

    if (!token) {
      return fail('Authentication required', 401);
    }

    try {
      verifyToken(token);
    } catch (caughtError) {
      console.warn('Invalid competition token', caughtError);
      return fail('Invalid or expired token', 401);
    }

    const competitions = getCompetitionsWithStats();
    const activeCompetition = competitions.find((competition) => competition.status === 'ACTIVE');

    if (!activeCompetition) {
      return fail('No active competitions available', 404);
    }

    return Response.json({
      id: activeCompetition.id,
      title: activeCompetition.title,
      subtitle: 'WITH A CLICK',
      imageUrl: activeCompetition.imageUrl || '/images/gold-coin.svg',
      hosts: ['Mr. Sarthak', 'Mr. Manjot'],
      status: activeCompetition.status,
    });
  } catch (caughtError) {
    console.error('Error fetching active competition', caughtError);
    return error('Failed to fetch active competition');
  }
}
