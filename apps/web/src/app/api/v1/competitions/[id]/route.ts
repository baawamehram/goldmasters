import { NextRequest } from 'next/server';
import {
  calculateTicketsSold,
  findParticipantById,
  getCompetitionById,
} from '@/server/data/mockDb';
import { success, error } from '@/server/http';
import { extractBearerToken, verifyToken } from '@/server/auth/jwt';

type CompetitionTokenPayload = {
  competitionId: string;
  type: string;
  participantId?: string;
};

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;

    const authorization = req.headers.get('authorization');
    const token = extractBearerToken(authorization);
    let participantId: string | null = null;

    if (token) {
      try {
        const decoded = verifyToken<CompetitionTokenPayload>(token);

        if (decoded.competitionId !== id) {
          throw new Error('Token competition mismatch');
        }

        if (decoded.type === 'participant_access') {
          participantId = decoded.participantId || null;
        }
      } catch (error) {
        console.log('Invalid or expired token, returning public data only', error);
      }
    }

    const baseCompetition = getCompetitionById(id);
    const ticketsSold = calculateTicketsSold(id);
    const remainingSlots = Math.max(0, baseCompetition.maxEntries - ticketsSold);

    const responseData: Record<string, unknown> = {
      competition: {
        id: baseCompetition.id,
        title: baseCompetition.title,
        imageUrl: baseCompetition.imageUrl,
        maxEntries: baseCompetition.maxEntries,
        ticketsSold,
        remainingSlots,
        status: baseCompetition.status,
        pricePerTicket: baseCompetition.pricePerTicket,
        markersPerTicket: baseCompetition.markersPerTicket,
        endsAt: baseCompetition.endsAt,
      },
    };

    if (participantId) {
      const participant = findParticipantById(id, participantId);
      if (participant) {
        const ticketsPurchased = participant.tickets.length;
        const entriesUsed = participant.tickets.reduce(
          (sum, ticket) => sum + ticket.markersUsed,
          0
        );
        const entriesRemaining = Math.max(
          0,
          ticketsPurchased * baseCompetition.markersPerTicket - entriesUsed
        );

        responseData.participantInfo = {
          participantId: participant.id,
          name: participant.name,
          phone: participant.phone,
          ticketsPurchased,
          entriesUsed,
          entriesRemaining,
        };
      }
    }

    return success(responseData);
  } catch (err) {
    console.error('Error fetching competition', err);
    return error('Failed to fetch competition');
  }
}
