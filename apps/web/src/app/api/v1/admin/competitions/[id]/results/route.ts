import { NextRequest } from 'next/server';
import { requireAdminToken } from '@/server/auth/admin';
import { success, error } from '@/server/http';

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const tokenOrResponse = requireAdminToken(req);
  if (tokenOrResponse instanceof Response) {
    return tokenOrResponse;
  }

  try {
    console.log('Fetching results for competition:', context.params.id);

    return success({
      results: [],
      averageJudgePosition: { x: 0, y: 0 },
    });
  } catch (err) {
    console.error('Failed to fetch results', err);
    return error('Failed to fetch results');
  }
}
