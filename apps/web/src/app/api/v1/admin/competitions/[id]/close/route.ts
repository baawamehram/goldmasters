import { NextRequest } from 'next/server';
import { requireAdminToken } from '@/server/auth/admin';
import {
  getCompetitionById,
  closeCompetition,
  calculateTicketsSold,
} from '@/server/data/db.service';
import { success, fail, error } from '@/server/http';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const tokenOrResponse = requireAdminToken(req);
  if (tokenOrResponse instanceof Response) {
    return tokenOrResponse;
  }

  try {
    const { id } = await context.params;

    const competition = await getCompetitionById(id);

    if (competition.status === 'CLOSED') {
      return fail('Competition already closed', 409);
    }

    const updated = await closeCompetition(id);
    if (!updated) {
      return error('Failed to close competition');
    }

    const ticketsSold = await calculateTicketsSold(id);

    return success({
      competition: {
        ...updated,
        ticketsSold,
        remainingSlots: Math.max(0, updated.maxEntries - ticketsSold),
      },
    });
  } catch (err) {
    console.error('Error closing competition', err);
    return error('Failed to close competition');
  }
}
