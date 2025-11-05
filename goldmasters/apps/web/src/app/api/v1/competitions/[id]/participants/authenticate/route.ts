import { NextRequest } from 'next/server';
import { fieldError, success, fail, validationFailure, error } from '@/server/http';
import {
  findParticipantByPhone,
  hasParticipantCompletedEntry,
  getUserEntryByPhone,
  updateUserTickets,
} from '@/server/data/mockDb';
import { signToken } from '@/server/auth/jwt';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: rawCompetitionId } = await context.params;
  const defaultCompetitionId = process.env.NEXT_PUBLIC_DEFAULT_COMPETITION_ID?.trim() || 'test-id';
  const isUserScopedId = rawCompetitionId.startsWith('user-') || rawCompetitionId.startsWith('participant-');
  const competitionId = isUserScopedId ? defaultCompetitionId : rawCompetitionId;

  try {
    const body = await req.json();
  const { name, phone } = body as { name?: string; phone?: string };

    const errors = [];

    if (!name || typeof name !== 'string' || !name.trim()) {
      errors.push(fieldError('name', 'Name is required', name));
    }

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      errors.push(fieldError('phone', 'Phone number is required', phone));
    }

    if (errors.length) {
      return validationFailure(errors, 400);
    }

  const nameValue = name!.trim();
  const phoneValue = phone!.trim();

  // First, make sure the admin has assigned tickets for this user
  const userEntry = getUserEntryByPhone(phoneValue);
  const desiredTicketCount = userEntry?.assignedTickets ?? 0;

  // Ensure we have a participant record for this competition
  let participant = findParticipantByPhone(competitionId, phoneValue);

  if (!participant && userEntry) {
  updateUserTickets(userEntry.id, desiredTicketCount, competitionId);
  participant = findParticipantByPhone(competitionId, phoneValue);
  }

  if (!participant) {
    return fail('Participant not found. Please contact support.', 404);
  }

  if (userEntry && participant.tickets.length !== desiredTicketCount) {
    updateUserTickets(userEntry.id, desiredTicketCount, competitionId);
    participant = findParticipantByPhone(competitionId, phoneValue) ?? participant;
  }

  if (hasParticipantCompletedEntry(competitionId, participant.id)) {
    return fail('This participant has already completed their entry and cannot play again.', 403);
  }

  const normalizedInputName = nameValue.toLowerCase();
    const storedName = participant.name.trim().toLowerCase();
    if (normalizedInputName !== storedName) {
      return fail(
        'Participant details do not match. Please try again or contact support.',
        401
      );
    }

    const participantAccessToken = signToken(
      {
        competitionId: competitionId,
        participantId: participant.id,
        type: 'participant_access',
      },
      { expiresIn: '24h' }
    );

    const ticketsPayload = participant.tickets.map((ticket) => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
      markersAllowed: ticket.markersAllowed,
      markersUsed: ticket.markersUsed,
      markers: ticket.markers,
      submittedAt: ticket.submittedAt,
    }));

    console.log('[authenticate] Authentication successful:', {
      competitionId,
      participantId: participant.id,
      ticketCount: participant.tickets.length
    });

    return success({
      participant: {
        id: participant.id,
  name: participant.name,
  phone: participant.phone,
        ticketsPurchased: participant.tickets.length,
      },
      participantAccessToken,
      tickets: ticketsPayload,
    });
  } catch (err) {
    console.error('Participant authentication error', err);
    return error('Failed to authenticate participant');
  }
}
