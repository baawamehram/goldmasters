import { NextRequest } from 'next/server';
import { success, error, fail } from '@/server/http';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    const { id, participantId } = await context.params;
    const token = req.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      return fail('Unauthorized', 401);
    }

    // Call backend Express API
    const backendUrl = `http://localhost:4000/api/v1/competitions/admin/${id}/participants/${participantId}/submissions`;
    
    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return fail(errorData.message || 'Failed to fetch submissions', response.status);
    }

    const data = await response.json();
    return success(data.data);
  } catch (err) {
    console.error('Error fetching submission details:', err);
    return error('Failed to fetch submission details');
  }
}
