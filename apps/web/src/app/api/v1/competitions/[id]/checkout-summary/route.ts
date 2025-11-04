import { NextRequest, NextResponse } from 'next/server';
import {
  getUserEntryByNameAndPhone,
  createOrUpdateUserEntry,
  markParticipantCompletedEntry,
  clearParticipantCompletion,
} from '@/server/data/db.service';

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

/**
 * POST /api/v1/competitions/[id]/checkout-summary
 * Save checkout summary with proper user identification
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const authHeader = req.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { status: 'fail', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const rawBody = await req.text();
    const checkoutData = JSON.parse(rawBody);

    const originalParticipantId = typeof checkoutData?.participant?.id === 'string'
      ? checkoutData.participant.id
      : null;

    // Extract participant info from checkout data
    const participantName = checkoutData?.participant?.name;
    const participantPhone = checkoutData?.participant?.phone;

    // The 'id' from URL is already the user's unique participant ID
    // Use it directly to ensure data is stored under the correct user
    if (participantName && participantPhone) {
      // Ensure user entry exists for this participant, using the URL ID
      let userEntry = await getUserEntryByNameAndPhone(participantName, participantPhone);
      
      if (!userEntry) {
        // Create user entry with the URL ID (user's unique ID from localStorage)
        userEntry = await createOrUpdateUserEntry(participantName, participantPhone, id);
      }
      
      // Update the checkout data to use the URL's ID (which is the user's unique ID)
      // This ensures data is stored under the user's unique ID from the URL
      checkoutData.competitionId = id;
      checkoutData.competition.id = id;
      checkoutData.participant.id = id; // Ensure participant ID matches the URL ID
    } else {
      // Even if participant info is missing, use the URL ID
      checkoutData.competitionId = id;
      checkoutData.competition.id = id;
    }

    // Forward to Express API with updated data
    const response = await fetch(
      `http://localhost:4000/api/v1/competitions/${id}/checkout-summary`,
      {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData),
      }
    );

    const responseText = await response.text();
    let responsePayload: any = null;
    try {
      responsePayload = JSON.parse(responseText);
    } catch {
      responsePayload = null;
    }

    if (response.ok) {
      const resolvedSummary = responsePayload?.summary ?? checkoutData;
      const completionFlag = resolvedSummary?.completed === true
        || resolvedSummary?.isCompleted === true
        || Boolean(resolvedSummary?.completedAt);

      const participantIdForCompletion = originalParticipantId
        ?? (typeof resolvedSummary?.participant?.id === 'string' ? resolvedSummary.participant.id : null);

      if (completionFlag) {
        await markParticipantCompletedEntry(id, participantIdForCompletion ?? originalParticipantId);
      } else {
        await clearParticipantCompletion(id, participantIdForCompletion ?? originalParticipantId);
      }
    }

    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (error) {
    console.error('Error proxying checkout-summary:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
