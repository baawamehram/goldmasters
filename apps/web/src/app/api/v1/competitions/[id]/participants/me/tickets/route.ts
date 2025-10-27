import { NextRequest } from 'next/server';
import { findParticipantById } from '@/server/data/mockDb';
import { fail, success, error } from '@/server/http';
import { requireParticipantToken } from '@/server/auth/participant';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const tokenOrResponse = requireParticipantToken(req, id);

    if (tokenOrResponse instanceof Response) {
      return tokenOrResponse;
    }

    const participant = findParticipantById(id, tokenOrResponse.participantId);
    if (!participant) {
      return fail('Participant record not found', 404);
    }

    return success({
      participant: {
        id: participant.id,
        name: participant.name,
        phone: participant.phone,
        ticketsPurchased: participant.tickets.length,
      },
      tickets: participant.tickets,
    });
  } catch (err) {
    console.error('Error fetching participant tickets', err);
    return error('Failed to fetch tickets');
  }
}
