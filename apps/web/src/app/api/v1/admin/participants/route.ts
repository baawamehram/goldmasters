import { NextRequest } from 'next/server';
import { getAllUserEntries, deleteUserEntriesByIds } from '@/server/data/mockDb';
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

    // Map to response format
    const participants = userEntries.map((entry) => ({
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
    }));

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
