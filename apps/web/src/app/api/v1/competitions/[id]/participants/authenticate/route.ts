import { NextRequest } from 'next/server';
import { fieldError, success, fail, validationFailure, error } from '@/server/http';
import { 
  findParticipantByPhone, 
  saveParticipant, 
  MockParticipant,
  getParticipants 
} from '@/server/data/mockDb';
import { signToken } from '@/server/auth/jwt';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: competitionId } = await context.params;

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

  // First, try to find participant in the requested competition
  let participant = findParticipantByPhone(competitionId, phoneValue);
  
  // If not found in this competition, check the default competition
  if (!participant) {
    const defaultCompetitionId = 'test-id';
    const defaultParticipant = findParticipantByPhone(defaultCompetitionId, phoneValue);
    
    if (defaultParticipant && defaultParticipant.tickets.length > 0) {
      // User has tickets in default competition, create participant for this competition
      console.log('[authenticate] Creating participant from default competition:', {
        sourceCompetition: defaultCompetitionId,
        targetCompetition: competitionId,
        ticketCount: defaultParticipant.tickets.length
      });
      
      const newParticipant: MockParticipant = {
        id: `participant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        competitionId: competitionId,
        name: defaultParticipant.name,
        phone: defaultParticipant.phone,
        email: defaultParticipant.email,
        tickets: defaultParticipant.tickets.map(ticket => ({
          ...ticket,
          id: `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        })),
        lastSubmissionAt: null,
      };
      
      saveParticipant(newParticipant);
      participant = newParticipant;
    }
  }
  
  if (!participant) {
    return fail('Participant not found. Please contact support.', 404);
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
