import { NextRequest } from 'next/server';
import { requireAdminToken } from '@/server/auth/admin';
import {
  calculateTicketsSold,
  findCompetitionById,
  getCompetitionResult,
} from '@/server/data/mockDb';
import { success, error, fail } from '@/server/http';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const tokenOrResponse = requireAdminToken(req);
  if (tokenOrResponse instanceof Response) {
    return tokenOrResponse;
  }

  try {
    const { id } = await context.params;

    const competition = findCompetitionById(id);
    if (!competition) {
      return fail('Competition not found', 404);
    }

    const result = getCompetitionResult(id);

    return success({
      competition: {
        id: competition.id,
        title: competition.title,
        status: competition.status,
        finalJudgeX:
          typeof competition.finalJudgeX === 'number' ? competition.finalJudgeX : null,
        finalJudgeY:
          typeof competition.finalJudgeY === 'number' ? competition.finalJudgeY : null,
        markersPerTicket: competition.markersPerTicket,
        ticketsSold: calculateTicketsSold(competition.id),
        maxEntries: competition.maxEntries,
      },
      result: result
        ? {
            competitionId: result.competitionId,
            finalJudgeX: result.finalJudgeX,
            finalJudgeY: result.finalJudgeY,
            computedAt: result.computedAt.toISOString(),
          }
        : null,
      winners: result
        ? result.winners.map((winner) => ({
            ticketId: winner.ticketId,
            ticketNumber: winner.ticketNumber,
            participantId: winner.participantId,
            participantName: winner.participantName,
            participantPhone: winner.participantPhone,
            distance: Number.isFinite(winner.distance)
              ? Number(winner.distance.toFixed(6))
              : null,
            marker: winner.marker
              ? {
                  id: winner.marker.id,
                  x: winner.marker.x,
                  y: winner.marker.y,
                }
              : null,
          }))
        : [],
    });
  } catch (err) {
    console.error('Failed to fetch results', err);
    return error('Failed to fetch results');
  }
}
