import { NextRequest } from 'next/server';
import { requireAdminToken } from '@/server/auth/admin';
import {
  findCompetitionById,
  getCompetitionResult,
  getParticipantsByCompetition,
} from '@/server/data/mockDb';
import { fail, error } from '@/server/http';

const formatNumber = (value: number | null, fractionDigits = 6) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '';
  }
  return value.toFixed(fractionDigits);
};

const escapeCsvValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = typeof value === 'number' ? value.toString() : String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const appendRow = (rows: string[][], row: Array<string | number | null | undefined>) => {
  rows.push(row.map((value) => escapeCsvValue(value)));
};

export async function GET(
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

    const participants = getParticipantsByCompetition(id);
    const result = getCompetitionResult(id);

    const finalJudgeX = typeof competition.finalJudgeX === 'number' ? competition.finalJudgeX : null;
    const finalJudgeY = typeof competition.finalJudgeY === 'number' ? competition.finalJudgeY : null;
    const computedAt = result?.computedAt ?? null;

    const winnerRankByTicketId = new Map<string, number>();
    result?.winners.forEach((winner, index) => {
      winnerRankByTicketId.set(winner.ticketId, index + 1);
    });

    const headers = [
      'competitionId',
      'competitionTitle',
      'participantId',
      'participantName',
      'participantPhone',
      'ticketId',
      'ticketNumber',
      'ticketStatus',
      'markerId',
      'markerX',
      'markerY',
      'distanceToFinal',
      'winnerRank',
      'finalJudgeX',
      'finalJudgeY',
      'computedAt',
    ];

    const rows: string[][] = [headers];

    if (participants.length === 0) {
      appendRow(rows, [
        competition.id,
        competition.title,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        formatNumber(finalJudgeX, 6),
        formatNumber(finalJudgeY, 6),
        computedAt ? computedAt.toISOString() : '',
      ]);
    } else {
      participants.forEach((participant) => {
        if (participant.tickets.length === 0) {
          appendRow(rows, [
            competition.id,
            competition.title,
            participant.id,
            participant.name,
            participant.phone,
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            formatNumber(finalJudgeX, 6),
            formatNumber(finalJudgeY, 6),
            computedAt ? computedAt.toISOString() : '',
          ]);
          return;
        }

        participant.tickets.forEach((ticket) => {
          const winnerRank = winnerRankByTicketId.get(ticket.id) ?? '';

          if (ticket.markers.length === 0) {
            appendRow(rows, [
              competition.id,
              competition.title,
              participant.id,
              participant.name,
              participant.phone,
              ticket.id,
              ticket.ticketNumber,
              ticket.status,
              '',
              '',
              '',
              '',
              winnerRank,
              formatNumber(finalJudgeX, 6),
              formatNumber(finalJudgeY, 6),
              computedAt ? computedAt.toISOString() : '',
            ]);
            return;
          }

          ticket.markers.forEach((marker) => {
            const distance =
              finalJudgeX !== null && finalJudgeY !== null
                ? Math.hypot(marker.x - finalJudgeX, marker.y - finalJudgeY)
                : null;

            appendRow(rows, [
              competition.id,
              competition.title,
              participant.id,
              participant.name,
              participant.phone,
              ticket.id,
              ticket.ticketNumber,
              ticket.status,
              marker.id,
              formatNumber(marker.x, 6),
              formatNumber(marker.y, 6),
              formatNumber(distance, 6),
              winnerRank,
              formatNumber(finalJudgeX, 6),
              formatNumber(finalJudgeY, 6),
              computedAt ? computedAt.toISOString() : '',
            ]);
          });
        });
      });
    }

    const csvContent = rows.map((row) => row.join(',')).join('\r\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="competition-${id}-results.csv"`,
      },
    });
  } catch (err) {
    console.error('Error exporting competition results', err);
    return error('Failed to export competition results');
  }
}
