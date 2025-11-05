import { NextRequest } from 'next/server';
import {
  fieldError,
  validationFailure,
  fail,
  success,
  error,
  ValidationError,
} from '@/server/http';
import {
  MockMarker,
  MockParticipant,
  MockTicket,
  getCompetitionById,
  findParticipantByPhone,
  saveParticipant,
  sanitizePhone,
  hasParticipantCompletedEntry,
} from '@/server/data/mockDb';

let mockTicketCounter = 200;

const isValidEmail = (value: string) => /.+@.+\..+/.test(value);

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const {
      name,
      phone,
      email,
      password,
      markers,
    } = body as {
      name?: string;
      phone?: string;
      email?: string;
      password?: string;
      markers?: Array<{
        ticketId?: string;
        ticketNumber?: number;
        x?: number;
        y?: number;
      }>;
    };

    const errors: ValidationError[] = [];

    if (!name || typeof name !== 'string' || !name.trim()) {
      errors.push(fieldError('name', 'Name is required', name));
    }

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      errors.push(fieldError('phone', 'Phone number is required', phone));
    }

    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      errors.push(fieldError('email', 'Valid email is required', email));
    }

    if (!password || typeof password !== 'string' || !password.trim()) {
      errors.push(fieldError('password', 'Checkout password is required', password));
    }

    if (!Array.isArray(markers) || markers.length === 0) {
      errors.push(fieldError('markers', 'Markers array is required', markers));
    } else {
      markers.forEach((marker, index) => {
        if (!marker.ticketId && !marker.ticketNumber) {
          errors.push(fieldError(`markers[${index}].ticketId`, 'ticketId is required for each marker', marker.ticketId));
        }

        if (typeof marker.x !== 'number' || marker.x < 0 || marker.x > 1) {
          errors.push(fieldError(`markers[${index}].x`, 'Marker X coordinate must be normalized between 0 and 1', marker.x));
        }

        if (typeof marker.y !== 'number' || marker.y < 0 || marker.y > 1) {
          errors.push(fieldError(`markers[${index}].y`, 'Marker Y coordinate must be normalized between 0 and 1', marker.y));
        }
      });
    }

    if (errors.length) {
      return validationFailure(errors, 400);
    }

    const normalizedPassword = password!.trim();
    const validCheckoutPasswords = ['checkout123', 'competition123'];
    const isPasswordValid = validCheckoutPasswords.includes(normalizedPassword);

    if (!isPasswordValid) {
      return fail('Invalid checkout password', 401);
    }

    const sanitizedPhone = sanitizePhone(phone!);
    const baseCompetition = getCompetitionById(id);
    const markersPerTicket = baseCompetition.markersPerTicket;

    const markerGroups = new Map<
      string,
      {
        ticketNumber: number | null;
        markers: MockMarker[];
      }
    >();

    markers!.forEach((markerPayload) => {
      const markerTicketId = markerPayload.ticketId || `ticket-${mockTicketCounter++}`;
      const existingGroup = markerGroups.get(markerTicketId) || {
        ticketNumber: markerPayload.ticketNumber ?? null,
        markers: [],
      };

      const markerIndex = existingGroup.markers.length + 1;
      existingGroup.markers.push({
        id: `${markerTicketId}-marker-${markerIndex}`,
        x: Number(markerPayload.x!.toFixed(4)),
        y: Number(markerPayload.y!.toFixed(4)),
      });

      if (existingGroup.ticketNumber === null && typeof markerPayload.ticketNumber === 'number') {
        existingGroup.ticketNumber = markerPayload.ticketNumber;
      }

      markerGroups.set(markerTicketId, existingGroup);
    });

    for (const [ticketId, group] of markerGroups.entries()) {
      if (group.markers.length !== markersPerTicket) {
        return fail(`Ticket ${ticketId} requires exactly ${markersPerTicket} markers`, 400);
      }
    }

    const existingParticipant = findParticipantByPhone(id, sanitizedPhone);
    if (existingParticipant && hasParticipantCompletedEntry(id, existingParticipant.id)) {
      return fail('This participant has already completed their entry and cannot submit another checkout.', 403);
    }
    const participantId = existingParticipant?.id || `participant-${Date.now()}`;

    const participantRecord: MockParticipant = existingParticipant
      ? {
          ...existingParticipant,
          name: name!.trim(),
          phone: sanitizedPhone,
          email: email!.trim().toLowerCase(),
        }
      : {
          id: participantId,
          competitionId: id,
          name: name!.trim(),
          phone: sanitizedPhone,
          email: email!.trim().toLowerCase(),
          tickets: [],
        };

    const updatedTickets: MockTicket[] = participantRecord.tickets.map((ticket) => ({
      ...ticket,
    }));

    for (const [ticketId, group] of markerGroups.entries()) {
      const existingTicket = updatedTickets.find((ticket) => ticket.id === ticketId);
      const ticketNumber = existingTicket?.ticketNumber || group.ticketNumber || mockTicketCounter++;

      const nextTicket: MockTicket = existingTicket
        ? { ...existingTicket }
        : {
            id: ticketId,
            ticketNumber,
            status: 'ASSIGNED',
            markersAllowed: markersPerTicket,
            markersUsed: 0,
            markers: [],
          };

      nextTicket.markers = group.markers;
      nextTicket.markersAllowed = markersPerTicket;
      nextTicket.markersUsed = group.markers.length;
      nextTicket.status = 'USED';
      nextTicket.submittedAt = new Date();

      if (existingTicket) {
        const index = updatedTickets.findIndex((ticket) => ticket.id === ticketId);
        updatedTickets[index] = nextTicket;
      } else {
        updatedTickets.push(nextTicket);
      }
    }

    participantRecord.tickets = updatedTickets;
    participantRecord.lastSubmissionAt = new Date();

    saveParticipant(participantRecord);

    const responseTickets = participantRecord.tickets.map((ticket) => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
      markersAllowed: ticket.markersAllowed,
      markersUsed: ticket.markersUsed,
      markers: ticket.markers,
      submittedAt: ticket.submittedAt,
    }));

    return success({
      message: 'Checkout completed successfully',
      participantId: participantRecord.id,
      tickets: responseTickets,
    });
  } catch (err) {
    console.error('Checkout error', err);
    return error('Failed to process checkout');
  }
}
