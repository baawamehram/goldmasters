import { NextRequest } from 'next/server';
import { success, error } from '@/server/http';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log('Fetching entries for participant:', id);

    return success({ entries: [] });
  } catch (err) {
    console.error('Failed to fetch entries', err);
    return error('Failed to fetch entries');
  }
}
