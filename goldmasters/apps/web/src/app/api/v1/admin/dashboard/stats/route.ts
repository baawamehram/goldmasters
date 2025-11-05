import { NextRequest } from 'next/server';
import { requireAdminToken } from '@/server/auth/admin';
import { success, error } from '@/server/http';

export async function GET(req: NextRequest) {
  const tokenOrResponse = requireAdminToken(req);
  if (tokenOrResponse instanceof Response) {
    return tokenOrResponse;
  }

  try {
    return success({
      totalCompetitions: 0,
      activeCompetitions: 0,
      totalParticipants: 0,
      totalRevenue: 0,
    });
  } catch (err) {
    console.error('Failed to fetch dashboard stats', err);
    return error('Failed to fetch dashboard stats');
  }
}
