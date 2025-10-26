import { NextRequest } from 'next/server';
import { updateUserTickets, getUserEntryById } from '@/server/data/mockDb';
import { success, error, fail } from '@/server/http';
import { authenticateAdmin } from '@/lib/auth';

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
    const user = getUserEntryById(userId);
    if (!user) {
      return fail('User not found', 404);
    }

    // Update tickets - works regardless of login status
    const updatedUser = updateUserTickets(userId, ticketCount);

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
