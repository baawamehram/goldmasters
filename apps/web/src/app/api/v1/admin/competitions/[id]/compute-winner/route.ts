import { NextRequest } from 'next/server';
import { requireAdminToken } from '@/server/auth/admin';
import {
  findCompetitionById,
  getParticipantsByCompetition,
  MockCompetitionResult,
  MockCompetitionWinner,
  saveCompetitionResult,
} from '@/server/data/mockDb';
import { success, fail, error } from '@/server/http';

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const tokenOrResponse = requireAdminToken(req);
  if (tokenOrResponse instanceof Response) {
    return tokenOrResponse;
  }

  try {
    const { id } = context.params;

    const competition = findCompetitionById(id);
    if (!competition) {
      return fail('Competition not found', 404);
    }

    if (typeof competition.finalJudgeX !== 'number' || typeof competition.finalJudgeY !== 'number') {
      return fail('Final judge coordinates are not set for this competition', 409);
    }

    const finalJudgeX = competition.finalJudgeX as number;
    const finalJudgeY = competition.finalJudgeY as number;

    const participants = getParticipantsByCompetition(id);
    const ticketScores: MockCompetitionWinner[] = [];

    participants.forEach((participant) => {
      participant.tickets.forEach((ticket) => {
        if (!ticket.markers.length) {
          return;
        }

        const closest = ticket.markers.reduce(
          (acc, marker) => {
            const distance = Math.hypot(marker.x - finalJudgeX, marker.y - finalJudgeY);

            if (distance < acc.distance) {
              return {
                marker,
                distance,
              };
            }

            return acc;
          },
          { marker: ticket.markers[0], distance: Number.POSITIVE_INFINITY }
        );

        ticketScores.push({
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          participantId: participant.id,
          participantName: participant.name,
          participantPhone: participant.phone,
          distance: closest.distance,
          marker: closest.marker,
        });
      });
    });

    if (!ticketScores.length) {
      const emptyResult: MockCompetitionResult = {
        competitionId: id,
        finalJudgeX,
        finalJudgeY,
        winners: [],
        computedAt: new Date(),
      };
      saveCompetitionResult(emptyResult);

      return success({
        result: {
          competitionId: emptyResult.competitionId,
          finalJudgeX: emptyResult.finalJudgeX,
          finalJudgeY: emptyResult.finalJudgeY,
          computedAt: emptyResult.computedAt.toISOString(),
        },
        winners: [],
      });
    }

    const sortedWinners = ticketScores
      .slice()
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);

    const result: MockCompetitionResult = {
      competitionId: id,
      finalJudgeX,
      finalJudgeY,
      winners: sortedWinners,
      computedAt: new Date(),
    };

    saveCompetitionResult(result);

    return success({
      result: {
        competitionId: result.competitionId,
        finalJudgeX: result.finalJudgeX,
        finalJudgeY: result.finalJudgeY,
        computedAt: result.computedAt.toISOString(),
      },
      winners: result.winners.map((winner) => ({
        ...winner,
        distance: Number(winner.distance.toFixed(6)),
      })),
    });
  } catch (err) {
    console.error('Error computing winners', err);
    return error('Failed to compute winners');
  }
}
