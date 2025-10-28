import { NextRequest } from 'next/server';
import { requireAdminToken } from '@/server/auth/admin';
import {
  calculateTicketsSold,
  setCompetitionFinalResult,
} from '@/server/data/mockDb';
import {
  fieldError,
  validationFailure,
  fail,
  success,
  error,
  ValidationError,
} from '@/server/http';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const tokenOrResponse = requireAdminToken(req);
  if (tokenOrResponse instanceof Response) {
    return tokenOrResponse;
  }

  try {
    const body = await req.json();
    const { finalJudgeX, finalJudgeY } = body as {
      finalJudgeX?: number;
      finalJudgeY?: number;
    };

    const errors: ValidationError[] = [];

    if (typeof finalJudgeX !== 'number') {
      errors.push(fieldError('finalJudgeX', 'finalJudgeX is required', finalJudgeX));
    } else if (finalJudgeX < 0 || finalJudgeX > 1) {
      errors.push(fieldError('finalJudgeX', 'finalJudgeX must be between 0 and 1', finalJudgeX));
    }

    if (typeof finalJudgeY !== 'number') {
      errors.push(fieldError('finalJudgeY', 'finalJudgeY is required', finalJudgeY));
    } else if (finalJudgeY < 0 || finalJudgeY > 1) {
      errors.push(fieldError('finalJudgeY', 'finalJudgeY must be between 0 and 1', finalJudgeY));
    }

    if (errors.length) {
      return validationFailure(errors, 400);
    }

    const { id } = await context.params;

    const updatedCompetition = setCompetitionFinalResult(
      id,
      Number(finalJudgeX),
      Number(finalJudgeY)
    );

    if (!updatedCompetition) {
      return fail('Competition not found', 404);
    }

    const ticketsSold = calculateTicketsSold(id);

    return success({
      competition: {
        ...updatedCompetition,
        ticketsSold,
        remainingSlots: Math.max(0, updatedCompetition.maxEntries - ticketsSold),
      },
    });
  } catch (err) {
    console.error('Error saving final result', err);
    return error('Failed to save final result');
  }
}
