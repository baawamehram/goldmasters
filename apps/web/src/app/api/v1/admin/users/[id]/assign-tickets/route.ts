import { NextRequest, NextResponse } from 'next/server';
import { updateUserTickets, getUserEntryById } from '@/server/data/db.service';
import { success, error, fail } from '@/server/http';
import { authenticateAdmin } from '@/lib/auth';

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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate admin
    const admin = authenticateAdmin(req);
    
    if (!admin) {
      return fail('Unauthorized', 401);
    }

    const params = await context.params;
    const { id: userId } = params;
    const body = await req.json();
    const { ticketCount } = body;

    // Validate ticket count
    if (typeof ticketCount !== 'number' || ticketCount < 0) {
      return fail('Invalid ticket count', 400);
    }

    // Check if user exists
    const user = await getUserEntryById(userId);
    if (!user) {
      return fail('User not found', 404);
    }

    // Get default competition ID from environment
    const defaultCompetitionId = process.env.NEXT_PUBLIC_DEFAULT_COMPETITION_ID || 'test-id';

    // Update tickets - works regardless of login status
    const updatedUser = await updateUserTickets(userId, ticketCount, defaultCompetitionId);

    if (!updatedUser) {
      return error('Failed to update tickets');
    }

    return success({
      id: updatedUser.id,
      name: updatedUser.name,
      phone: updatedUser.phone,
      email: updatedUser.email,
      assignedTickets: updatedUser.assignedTickets,
      isLoggedIn: updatedUser.isLoggedIn,
      currentPhase: updatedUser.currentPhase,
      accessCode: updatedUser.accessCode,
    });
  } catch (err) {
    console.error('Error assigning tickets:', err);
    return error('Failed to assign tickets');
  }
}
