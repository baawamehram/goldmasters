import { NextRequest, NextResponse } from 'next/server';
import {
  findParticipantsByPhone,
  getCompetitionsByIds,
  sanitizePhone,
  createOrUpdateUserEntry,
} from '@/server/data/db.service';
import { fieldError, validationFailure, fail, success, error, ValidationError } from '@/server/http';
import { signToken } from '@/server/auth/jwt';

// Add OPTIONS handler for CORS preflight
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, isAdult } = body as { name?: string; phone?: string; isAdult?: unknown };

  const errors: ValidationError[] = [];

    if (!name || typeof name !== 'string' || !name.trim()) {
      errors.push(fieldError('name', 'Full name is required', name));
    }

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      errors.push(fieldError('phone', 'Phone number is required', phone));
    }

    if (typeof isAdult !== 'boolean') {
      errors.push(fieldError('isAdult', 'Age confirmation must be provided', isAdult));
    } else if (isAdult !== true) {
      errors.push(fieldError('isAdult', 'You must confirm that you are 18 years or older', isAdult));
    }

    if (errors.length) {
      return validationFailure(errors, 400);
    }

    // Auto-create or update user entry
    const userEntry = await createOrUpdateUserEntry(name!.trim(), phone!.trim());

    const participants = await findParticipantsByPhone(phone!);

    // If no participant found, return the user entry data anyway (for new users)
    if (participants.length === 0) {
      const loginToken = signToken(
        {
          type: 'participant_login',
          phone: sanitizePhone(phone!),
          participantIds: [],
        },
        { expiresIn: '12h' }
      );

      return success({
        token: loginToken,
        participant: {
          id: userEntry.id,
          name: userEntry.name,
          phone: userEntry.phone,
          ticketsPurchased: 0,
        },
        competitions: [],
      });
    }

    const uniqueNames = Array.from(
      new Set(participants.map((participant) => participant.name.trim().toLowerCase()))
    );

    if (uniqueNames.length > 1) {
      return fail(
        'Multiple participant profiles are linked to this phone number. Please contact support.',
        409
      );
    }

    const primaryParticipant = participants[0];
    const competitionIds = Array.from(
      new Set(participants.map((participant) => participant.competitionId))
    );

    const competitions = (await getCompetitionsByIds(competitionIds)).map((competition) => ({
      id: competition.id,
      title: competition.title,
      status: competition.status,
      imageUrl: competition.imageUrl,
      pricePerTicket: competition.pricePerTicket,
      markersPerTicket: competition.markersPerTicket,
      endsAt: competition.endsAt.toISOString(),
    }));

    const loginToken = signToken(
      {
        type: 'participant_login',
        phone: sanitizePhone(primaryParticipant.phone),
        participantIds: participants.map((participant) => participant.id),
      },
      { expiresIn: '12h' }
    );

    return success({
      token: loginToken,
      participant: {
        id: userEntry.id, // Use userEntry.id instead of primaryParticipant.id for consistency
        name: primaryParticipant.name,
        phone: primaryParticipant.phone,
        ticketsPurchased: primaryParticipant.tickets.length,
      },
      competitions,
    });
  } catch (err) {
    console.error('Participant login error', err);
    return error('Failed to authenticate participant');
  }
}
