import { NextRequest } from 'next/server';
import { requireAdminToken } from '@/server/auth/admin';
import {
  fieldError,
  validationFailure,
  fail,
  success,
  error,
  ValidationError,
} from '@/server/http';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const tokenOrResponse = requireAdminToken(req);
  if (tokenOrResponse instanceof Response) {
    return tokenOrResponse;
  }

  try {
    const body = await req.json();
    const { participantId, ticketCount } = body as {
      participantId?: string;
      ticketCount?: number;
    };

    const errors: ValidationError[] = [];

    if (!participantId || typeof participantId !== 'string' || !participantId.trim()) {
      errors.push(fieldError('participantId', 'Participant ID is required', participantId));
    }

    if (
      typeof ticketCount !== 'number' ||
      !Number.isInteger(ticketCount) ||
      ticketCount < 1 ||
      ticketCount > 100
    ) {
      errors.push(
        fieldError('ticketCount', 'Ticket count must be between 1 and 100', ticketCount)
      );
    }

    if (errors.length) {
      return validationFailure(errors, 400);
    }

  const { id: competitionId } = await context.params;

    const mockCompetition = {
      id: competitionId,
      maxEntries: 100,
      ticketsSold: 45,
      status: 'ACTIVE',
      pricePerTicket: 500,
    };

    if (!mockCompetition) {
      return fail('Competition not found', 404);
    }

    if (mockCompetition.status !== 'ACTIVE') {
      return fail('Cannot assign tickets to inactive competition', 403);
    }

    const remainingSlots = mockCompetition.maxEntries - mockCompetition.ticketsSold;
    if (ticketCount! > remainingSlots) {
      return fail(`Only ${remainingSlots} slots remaining. Cannot assign ${ticketCount} tickets.`, 400);
    }

    const mockParticipant = {
      id: participantId!,
      name: 'John Doe',
      email: 'john@example.com',
    };

    if (!mockParticipant) {
      return fail('Participant not found', 404);
    }

    const mockTickets = Array.from({ length: ticketCount! }, (_, index) => ({
      id: `ticket-${Date.now()}-${index}`,
      competitionId,
      participantId: participantId!,
      status: 'RESERVED',
      purchaseDate: new Date().toISOString(),
      amount: mockCompetition.pricePerTicket,
    }));

    console.log(
      `Assigned ${ticketCount} tickets to participant ${participantId} for competition ${competitionId}`
    );

    return success({
      message: `Successfully assigned ${ticketCount} ticket(s) to ${mockParticipant.name}`,
      tickets: mockTickets,
      newTicketsSold: mockCompetition.ticketsSold + ticketCount!,
      remainingSlots: remainingSlots - ticketCount!,
    }, 201);
  } catch (err) {
    console.error('Error assigning tickets', err);
    return error('Failed to assign tickets');
  }
}
