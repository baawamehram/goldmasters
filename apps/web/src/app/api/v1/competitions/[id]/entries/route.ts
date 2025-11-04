import { NextRequest } from 'next/server';
import { requireParticipantToken } from '@/server/auth/participant';
import {
  findParticipantById,
  MockParticipant,
  MockTicket,
  saveParticipant,
  hasParticipantCompletedEntry,
} from '@/server/data/db.service';
import { fieldError, validationFailure, fail, success, error, ValidationError } from '@/server/http';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const tokenOrResponse = requireParticipantToken(req, id);

    if (tokenOrResponse instanceof Response) {
      return tokenOrResponse;
    }

    const body = await req.json();
    const { tickets } = body as {
      tickets?: Array<{
        ticketId?: string;
        markers?: Array<{ x?: number; y?: number }>;
      }>;
    };

    const errors: ValidationError[] = [];

    if (!Array.isArray(tickets) || tickets.length === 0) {
      errors.push(fieldError('tickets', 'Tickets payload is required', tickets));
    } else {
      tickets.forEach((ticket, ticketIndex) => {
        if (!ticket.ticketId) {
          errors.push(fieldError(`tickets[${ticketIndex}].ticketId`, 'Ticket ID is required', ticket.ticketId));
        }

        if (!Array.isArray(ticket.markers) || ticket.markers.length === 0) {
          errors.push(fieldError(`tickets[${ticketIndex}].markers`, 'Markers array is required for each ticket', ticket.markers));
        } else {
          ticket.markers.forEach((marker, markerIndex) => {
            if (typeof marker.x !== 'number' || marker.x < 0 || marker.x > 1) {
              errors.push(fieldError(`tickets[${ticketIndex}].markers[${markerIndex}].x`, 'Marker X coordinate must be a normalized value between 0 and 1', marker.x));
            }

            if (typeof marker.y !== 'number' || marker.y < 0 || marker.y > 1) {
              errors.push(fieldError(`tickets[${ticketIndex}].markers[${markerIndex}].y`, 'Marker Y coordinate must be a normalized value between 0 and 1', marker.y));
            }
          });
        }
      });
    }

    if (errors.length) {
      return validationFailure(errors, 400);
    }

    const participant = await findParticipantById(id, tokenOrResponse.participantId);
    if (!participant) {
      return fail('Participant not found', 404);
    }

    if (await hasParticipantCompletedEntry(id, participant.id)) {
      return fail('This entry is already completed. Additional markers cannot be submitted.', 403);
    }

    const submissions: MockTicket[] = [];

    for (const ticketSubmission of tickets!) {
      const ticket = participant.tickets.find((t) => t.id === ticketSubmission.ticketId);

      if (!ticket) {
        return fail(`Ticket ${ticketSubmission.ticketId} not found for participant`, 400);
      }

      if (ticket.status === 'USED') {
        return fail(`Ticket ${ticket.ticketNumber} has already been submitted`, 409);
      }

      if (ticketSubmission.markers!.length !== ticket.markersAllowed) {
        return fail(
          `Ticket ${ticket.ticketNumber} requires exactly ${ticket.markersAllowed} markers`,
          400
        );
      }

      submissions.push({
        ...ticket,
        markers: ticketSubmission.markers!.map((marker, index) => ({
          id: `${ticket.id}-marker-${index + 1}`,
          x: marker.x!,
          y: marker.y!,
        })),
        markersUsed: ticketSubmission.markers!.length,
        status: 'USED',
        submittedAt: new Date(),
      });
    }

    const updatedTickets = participant.tickets.map((ticket) => {
      const submission = submissions.find((submitted) => submitted.id === ticket.id);
      return submission ? submission : ticket;
    });

    const updatedParticipant: MockParticipant = {
      ...participant,
      tickets: updatedTickets,
      lastSubmissionAt: new Date(),
    };

    await saveParticipant(updatedParticipant);

    const responseTickets = updatedParticipant.tickets.map((ticket) => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
      markersAllowed: ticket.markersAllowed,
      markersUsed: ticket.markersUsed,
      markers: ticket.markers,
      submittedAt: ticket.submittedAt,
    }));

    return success({
      message: 'Entry submitted successfully',
      tickets: responseTickets,
      participant: {
        id: updatedParticipant.id,
        name: updatedParticipant.name,
        phone: updatedParticipant.phone,
        ticketsPurchased: updatedParticipant.tickets.length,
      },
    }, 201);
  } catch (err) {
    console.error('Error submitting markers', err);
    return error('Failed to submit entry');
  }
}
