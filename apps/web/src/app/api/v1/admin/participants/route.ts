import { NextRequest } from 'next/server';
import { getAllUserEntries } from '@/server/data/mockDb';
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
