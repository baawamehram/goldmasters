import { NextRequest } from 'next/server';
import { fieldError, validationFailure, success, error, ValidationError } from '@/server/http';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { competitionId, participantId, numberOfTickets } = body as {
      competitionId?: string;
      participantId?: string;
      numberOfTickets?: number;
    };

    const errors: ValidationError[] = [];

    if (!competitionId || typeof competitionId !== 'string' || !competitionId.trim()) {
      errors.push(fieldError('competitionId', 'Competition ID is required', competitionId));
    }

    if (!participantId || typeof participantId !== 'string' || !participantId.trim()) {
      errors.push(fieldError('participantId', 'Participant ID is required', participantId));
    }

    if (typeof numberOfTickets !== 'number' || !Number.isInteger(numberOfTickets) || numberOfTickets < 1) {
      errors.push(
        fieldError('numberOfTickets', 'Number of tickets must be at least 1', numberOfTickets)
      );
    }

    if (errors.length) {
      return validationFailure(errors, 400);
    }

    const competitionIdValue = competitionId!.trim();
    const participantIdValue = participantId!.trim();
    const numberOfTicketsValue = numberOfTickets as number;

    console.log('Processing checkout:', {
      competitionId: competitionIdValue,
      participantId: participantIdValue,
      numberOfTickets: numberOfTicketsValue,
    });

    return success({
      orderId: 'generated-order-id',
      ticketsAssigned: numberOfTicketsValue,
      totalMarkers: numberOfTicketsValue * 3,
    });
  } catch (err) {
    console.error('Failed to process checkout', err);
    return error('Failed to process checkout');
  }
}
