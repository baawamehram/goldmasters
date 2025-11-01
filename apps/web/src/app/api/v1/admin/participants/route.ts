import { NextRequest } from 'next/server';
import {
  getAllUserEntries,
  deleteUserEntriesByIds,
  createManualUserEntry,
  updateUserTickets,
  findParticipantsByPhone,
} from '@/server/data/mockDb';
import { success, error, fail } from '@/server/http';
import { authenticateAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Authenticate admin
    const admin = authenticateAdmin(req);
    
    if (!admin) {
      return fail('Unauthorized', 401);
    }

    // Get all user entries
    const userEntries = getAllUserEntries();
    const defaultCompetitionId = process.env.NEXT_PUBLIC_DEFAULT_COMPETITION_ID?.trim() || 'test-id';

    // Map to response format
    const participants = userEntries.map((entry) => {
      const linkedParticipants = findParticipantsByPhone(entry.phone);
      const primaryParticipant =
        linkedParticipants.find((participant) => participant.competitionId === defaultCompetitionId) ??
        linkedParticipants[0] ??
        null;

      return {
        id: entry.id,
        name: entry.name,
        phone: entry.phone,
        email: entry.email,
        createdAt: entry.createdAt.toISOString(),
        assignedTickets: entry.assignedTickets,
        isLoggedIn: entry.isLoggedIn,
        lastLoginAt: entry.lastLoginAt?.toISOString() || null,
        lastLogoutAt: entry.lastLogoutAt?.toISOString() || null,
        accessCode: entry.accessCode,
        currentPhase: entry.currentPhase,
        competitionId: primaryParticipant?.competitionId ?? defaultCompetitionId,
        participantId: primaryParticipant?.id ?? null,
        ticketsPurchased: primaryParticipant?.tickets.length ?? entry.assignedTickets,
      };
    });

    return success(participants);
  } catch (err) {
    console.error('Error fetching participants:', err);
    return error('Failed to fetch participants');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = authenticateAdmin(req);
    if (!admin) {
      return fail('Unauthorized', 401);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch (_e) {
      return fail('Invalid request body', 400);
    }

    const bodyData = body as { participants?: Array<{ userId?: string; id?: string }> } | null;
    const participants = Array.isArray(bodyData?.participants) ? bodyData.participants : [];

    if (!participants.length) {
      return fail('No participants provided for deletion', 400);
    }

    // Extract user IDs from the participants array
    const userIds = participants
      .map((p: { userId?: string; id?: string }) => p.userId || p.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    if (!userIds.length) {
      return fail('No valid user IDs provided', 400);
    }

    console.log(`[DELETE /admin/participants] Attempting to delete users: ${userIds.join(', ')}`);

    const result = deleteUserEntriesByIds(userIds);

    if (result.deleted === 0) {
      return fail('No participants were deleted', 404);
    }

    console.log(`[DELETE /admin/participants] Successfully deleted ${result.deleted} participant(s)`);

    return success({
      deleted: result.deleted,
      attempted: participants.length,
      message: `Successfully deleted ${result.deleted} participant(s)`,
    });
  } catch (err) {
    console.error('[DELETE /admin/participants] Error:', err);
    return error(err instanceof Error ? err.message : 'Failed to delete participants');
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = authenticateAdmin(req);
    if (!admin) {
      return fail('Unauthorized', 401);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch (_error) {
      return fail('Invalid request body', 400);
    }

    const { name, phone, email, initialTickets, userId } = (body ?? {}) as {
      name?: unknown;
      phone?: unknown;
      email?: unknown;
      initialTickets?: unknown;
      userId?: unknown;
    };

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedPhone = typeof phone === 'string' ? phone.trim() : '';
    const trimmedEmail = typeof email === 'string' ? email.trim() : '';
    const requestedUserId = typeof userId === 'string' ? userId.trim() : '';

    if (!trimmedName) {
      return fail('Name is required', 400);
    }

    if (!trimmedPhone) {
      return fail('Phone number is required', 400);
    }

    const parsedTickets = Number.parseInt(String(initialTickets ?? '0'), 10);
    if (Number.isNaN(parsedTickets) || parsedTickets < 0) {
      return fail('Initial tickets must be zero or a positive number', 400);
    }

    let newEntry;
    try {
      newEntry = createManualUserEntry({
        name: trimmedName,
        phone: trimmedPhone,
        email: trimmedEmail || null,
        id: requestedUserId || null,
      });
    } catch (creationError) {
      const message =
        creationError instanceof Error
          ? creationError.message
          : 'Unable to create participant';
      return fail(message, 400);
    }

  const desiredTicketCount = Math.min(parsedTickets, 100);
    if (desiredTicketCount > 0) {
      updateUserTickets(newEntry.id, desiredTicketCount);
    }

    const refreshedEntries = getAllUserEntries();
    const hydrated = refreshedEntries.find((entry) => entry.id === newEntry.id) ?? newEntry;

    return success(hydrated, 201);
  } catch (err) {
    console.error('[POST /admin/participants] Error:', err);
    const message = err instanceof Error ? err.message : 'Failed to create participant';
    return error(message);
  }
}
