import { getCompetitionsWithStats } from '@/server/data/mockDb';
import { success, error } from '@/server/http';

export async function GET() {
  try {
    const competitions = getCompetitionsWithStats();
    return success({ competitions });
  } catch (caughtError) {
    console.error('Failed to fetch competitions', caughtError);
    return error('Failed to fetch competitions');
  }
}
